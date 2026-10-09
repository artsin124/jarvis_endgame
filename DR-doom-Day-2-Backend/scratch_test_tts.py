import asyncio
from app.services.edge_tts_service import generate_speech, VOICE_IDS

async def main():
    print(f"Available voices: {VOICE_IDS}")
    try:
        audio_bytes = await generate_speech("Hello from Jarvis!", "en-US-GuyNeural")
        with open("test_output.mp3", "wb") as f:
            f.write(audio_bytes)
        print("Successfully generated test_output.mp3!")
    except Exception as e:
        print(f"Error generating speech: {e}")

if __name__ == "__main__":
    asyncio.run(main())
