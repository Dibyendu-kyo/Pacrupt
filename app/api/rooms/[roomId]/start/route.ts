import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { getFallbackViewerCount, isFirebaseQuotaExceeded } from "../presence/route"

// In-memory storage
// const rooms = new Map<string, any>()

export async function POST(request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  try {
    console.log("[START] Game start request for room:", roomId)
    
    // Accept playerWallet and difficulty from request body
    const body = await request.json();
    const playerWallet = body.playerWallet || null;
    const difficulty = body.difficulty || 'medium';
    console.log("[INFO] playerWallet:", playerWallet, "difficulty:", difficulty)
    
    // Difficulty settings
    const difficultySettings = {
      easy: {
        enemyCount: 2,
        enemySpeed: 1,
        enemyChaseRate: 0.6,
        playerHealth: 150,
        timeLimit: 180,
      },
      medium: {
        enemyCount: 3,
        enemySpeed: 2,
        enemyChaseRate: 0.75,
        playerHealth: 100,
        timeLimit: 120,
      },
      hard: {
        enemyCount: 4,
        enemySpeed: 3,
        enemyChaseRate: 0.9,
        playerHealth: 75,
        timeLimit: 90,
      }
    }
    
    const settings = difficultySettings[difficulty as keyof typeof difficultySettings] || difficultySettings.medium
    console.log("[INFO] Using settings:", settings)
    
    console.log("[FETCH] Calling /api/generate-map for difficulty:", difficulty)
    const mapResponse = await fetch(`${request.nextUrl.origin}/api/generate-map?difficulty=${difficulty}`)
    console.log("[FETCH] /api/generate-map status:", mapResponse.status)
    if (!mapResponse.ok) {
      console.error("[ERROR] Failed to generate map:", mapResponse.status)
      return NextResponse.json({ error: "Failed to generate map" }, { status: 500 })
    }
    
    const mapData = await mapResponse.json()
    console.log("[SUCCESS] Map generated for difficulty:", difficulty, mapData)
    
    // Get existing room data to preserve viewer count
    let existingViewers = 0
    
    // Check if Firebase quota is exceeded
    if (isFirebaseQuotaExceeded()) {
      console.log("[WARN] Firebase quota exceeded, using fallback viewer count")
      existingViewers = getFallbackViewerCount(roomId)
    } else {
      try {
        console.log("[FIRESTORE] Fetching existing room data for:", roomId)
        const roomRef = doc(db, "rooms", roomId)
        const existingRoom = await getDoc(roomRef)
        existingViewers = existingRoom.exists() ? (existingRoom.data()?.viewers || 0) : 0
        console.log("[FIRESTORE] Existing viewers:", existingViewers)
      } catch (error: any) {
        console.warn("[WARN] Could not fetch existing room data, using 0 viewers:", error.message)
      }
    }
    
    const gameState = {
      player: {
        x: Number(mapData.playerStart.x),
        y: Number(mapData.playerStart.y),
        health: settings.playerHealth,
        speed: 1.0,
        score: 0,
      },
      enemies: mapData.enemies.map((enemy: any) => ({
        id: enemy.id,
        x: Number(enemy.x),
        y: Number(enemy.y)
      })),
      obstacles: [],
      goal: {
        x: Number(mapData.goal.x),
        y: Number(mapData.goal.y)
      },
      maze: JSON.stringify(mapData.maze),
      gameStatus: "playing" as const,
      viewers: existingViewers, // Preserve existing viewer count
      lastUpdate: Date.now(),
      timeLeft: 120,
    }
    
    console.log("[INFO] Game state created for room:", roomId, gameState)
    
    // If Firebase quota is exceeded, return game state without saving to Firestore
    if (isFirebaseQuotaExceeded()) {
      console.log("[WARN] Firebase quota exceeded, returning game state without saving to Firestore")
      return NextResponse.json({ 
        ...gameState, 
        fallback: true,
        warning: "Using fallback mode due to service limits" 
      })
    }
    
    const firestoreData = {
      player: gameState.player,
      enemies: gameState.enemies,
      obstacles: gameState.obstacles,
      goal: gameState.goal,
      maze: gameState.maze,
      gameStatus: gameState.gameStatus,
      viewers: gameState.viewers,
      lastUpdate: gameState.lastUpdate,
      timeLeft: gameState.timeLeft,
      playerWallet, // Store the player's wallet address
    }
    
    console.log("[FIRESTORE] Writing game state to Firestore for room:", roomId)
    console.log("[FIRESTORE] Data:", JSON.stringify(firestoreData, null, 2))
    
    try {
      const roomRef = doc(db, "rooms", roomId)
      await setDoc(roomRef, firestoreData, { merge: true })
      console.log("[SUCCESS] Game started and written to Firestore for room:", roomId)
    } catch (error: any) {
      if (error.code === 'resource-exhausted') {
        console.warn('[WARN] Firebase quota exceeded, returning game state without saving to Firestore')
        return NextResponse.json({ 
          ...gameState, 
          fallback: true,
          warning: "Using fallback mode due to service limits" 
        })
      }
      console.error("[ERROR] Firestore setDoc failed:", error)
      throw error
    }
    
    return NextResponse.json(gameState)
  } catch (error) {
    console.error("[FATAL] Game start error:", error)
    return NextResponse.json({ 
      error: "Failed to start game", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}
