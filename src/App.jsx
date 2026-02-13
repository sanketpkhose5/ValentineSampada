import { Canvas, useFrame } from "@react-three/fiber";
import { ScrollControls, useScroll, Environment, useGLTF, Sky } from "@react-three/drei";
import { EffectComposer, DepthOfField, Bloom } from "@react-three/postprocessing";
import { useRef, useState } from "react";
import { useEffect, Suspense } from "react";
import * as THREE from "three";

function Scooter({ scooterRef }) {
  const { scene } = useGLTF("/models/scene.gltf");

  useEffect(() => {
    scene.scale.set(0.1, 0.1, 0.1);   // adjust later if needed
    scene.rotation.y = Math.PI / 2; // face forward
    scene.position.y = 0.8;
    scene.visible = false;  // Hidden initially, appears later
  }, [scene]);

  return <primitive ref={scooterRef} object={scene} />;
}


function EiffelTower() {
  // Fallback golden cone - replace with real model when available
  return (
    <mesh position={[0, 10, -160]}>
      <coneGeometry args={[6, 20, 6]} />
      <meshStandardMaterial color="#d4af37" />
    </mesh>
  );
}

function Eiffel() {
  const { scene } = useGLTF("/models/eiffel/scene.gltf");

  useEffect(() => {
    if (scene) {
      scene.scale.set(8, 8, 8);
      scene.position.set(0, 0, -180);
    }
  }, [scene]);

  return <primitive object={scene} />;
}

function HeroUI() {
  return (
    <div
      style={{
        position: "absolute",
        top: "40%",
        width: "100%",
        textAlign: "center",
        color: "#1e1817",
        fontFamily: "Playfair Display, serif",
        fontSize: "4rem",
        letterSpacing: "2px",
        pointerEvents: "none",
      }}
    >
      Sampada, My Love
      <div style={{ fontSize: "1rem", marginTop: "10px", opacity: 0.6 }}>
        In every lifetime, I choose you❤️
      </div>
    </div>
  );
}

function Scene({ checkpoint }) {
  const scooterRef = useRef();
  const groupRef = useRef();
  const scroll = useScroll();

  useFrame(({ camera }) => {
    const progress = scroll.offset;

    // Scroll lock logic
    let maxScroll = 1;

    if (checkpoint === 0) maxScroll = 0.35;
    if (checkpoint === 1) maxScroll = 0.6;
    if (checkpoint === 2) maxScroll = 0.85;

    if (scroll.offset > maxScroll) {
      scroll.el.scrollTop = maxScroll * scroll.el.scrollHeight;
    }

    // -------- BEFORE FINAL --------
    if (checkpoint < 3) {

      const targetZ = -progress * 180;
      const targetY = 50 - progress * 3;

      camera.position.lerp(
        new THREE.Vector3(0, targetY, 60 + targetZ),
        0.05
      );

      camera.lookAt(0, 5, -160);
    }

    // -------- FINAL LOCKED CAMERA --------
    else {

      // Fixed cinematic high angle
      camera.position.lerp(
        new THREE.Vector3(0, 50, -60),
        0.04
      );

      camera.lookAt(0, 8, -180);
    }
  });


  return (
    <group ref={groupRef}>
      <fog attach="fog" args={["#ffe6d6", 150, 600]} />

      <ambientLight intensity={0.5} />

      <directionalLight
        position={[30, 50, 20]}
        intensity={2.2}
        color="#ffb38a"
      />

      <hemisphereLight
        skyColor="#ffd4b8"
        groundColor="#f6c7a3"
        intensity={0.8}
      />

      <directionalLight
        position={[20, 30, 10]}
        intensity={2}
        color="#ffb37a"
      />

      <Sky
        distance={450000}
        sunPosition={[10, 5, -20]}
        inclination={0.49}
        azimuth={0.25}
        turbidity={6}
        rayleigh={3}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      {/* Massive River */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, -200]}>
        <planeGeometry args={[200, 800]} />
        <meshStandardMaterial
          color="#f0a98a"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Bridge */}
      <mesh position={[0, 10, -120]}>
        <boxGeometry args={[200, 4, 40]} />
        <meshStandardMaterial color="#e8d8c3" />
      </mesh>

      {/* Eiffel Placeholder */}
      <Eiffel />

      {/* Cinematic depth of field effect */}
      <EffectComposer>
        <DepthOfField
          focusDistance={0.02}
          focalLength={0.02}
          bokehScale={2}
          height={480}
        />
        <Bloom
          intensity={0.8}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
        />
      </EffectComposer>
    </group>
  );
}


export default function App() {
  const [checkpoint, setCheckpoint] = useState(0);
  const [acceptedValentine, setAcceptedValentine] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // Set volume immediately
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
    }

    // Try to play audio when component mounts
    const playAudio = async () => {
      try {
        if (audioRef.current) {
          await audioRef.current.play();
          console.log("Audio playing automatically");
        }
      } catch (err) {
        console.log("Autoplay blocked, waiting for user interaction");
      }
    };
    
    // Delay to ensure audio element is ready
    const timer = setTimeout(playAudio, 500);

    // Add click/touch listeners for mobile - play on any interaction
    const playOnInteraction = async () => {
      try {
        if (audioRef.current && audioRef.current.paused) {
          await audioRef.current.play();
          console.log("Audio started on user interaction");
        }
      } catch (err) {
        console.log("Could not play audio:", err);
      }
    };

    document.addEventListener("click", playOnInteraction);
    document.addEventListener("touchstart", playOnInteraction);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", playOnInteraction);
      document.removeEventListener("touchstart", playOnInteraction);
    };
  }, []);

  return (
    <div style={{
      height: "100vh",
      width: "100vw",
      overflow: "hidden",
      position: "relative"
    }}>
      <audio ref={audioRef} loop preload="auto">
        <source src="/music/ringtone.mp3" type="audio/mpeg" />
      </audio>

      <style>
        {`
          @keyframes fadeInDown {
            from {
              opacity: 0;
              transform: translateY(-30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes floatHeart {
            0% {
              transform: translateY(100vh) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(-100vh) rotate(360deg);
              opacity: 0;
            }
          }

          @keyframes pulse {
            0%, 100% {
              box-shadow: 0 10px 30px rgba(212, 105, 105, 0.3), 0 0 20px rgba(212, 105, 105, 0.5);
            }
            50% {
              box-shadow: 0 15px 40px rgba(212, 105, 105, 0.5), 0 0 40px rgba(212, 105, 105, 0.7);
            }
          }

          @keyframes confetti {
            0% {
              transform: translate(0, 0) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translate(var(--tx), var(--ty)) rotate(720deg);
              opacity: 0;
            }
          }

          .floating-heart {
            position: fixed;
            font-size: 2rem;
            animation: floatHeart linear infinite;
            pointer-events: none;
            z-index: 1;
          }

          .confetti-piece {
            position: fixed;
            pointer-events: none;
            animation: confetti 1.5s ease-out forwards;
            z-index: 10;
          }

          .fade-in-heading {
            animation: fadeInDown 1.2s ease forwards;
          }

          .fade-in-subheading {
            animation: fadeInDown 1.5s ease forwards;
          }

          .pulse-button {
            animation: pulse 2s ease-in-out infinite;
          }
        `}
      </style>

      {!acceptedValentine ? (
        <div style={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #ffe6d6 0%, #ffd4b8 100%)",
          flexDirection: "column",
          fontFamily: "Playfair Display, serif",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Floating Hearts Background */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="floating-heart"
              style={{
                left: `${Math.random() * 100}%`,
                animationDuration: `${8 + Math.random() * 4}s`,
                animationDelay: `${i * 1.5}s`
              }}
            >
              ❤️
            </div>
          ))}

          <h1 
            className="fade-in-heading"
            style={{
            fontSize: "3.5rem",
            color: "#5c2c1e",
            margin: "0 0 40px 0",
            letterSpacing: "2px",
            textAlign: "center",
            fontWeight: 500
          }}>
            Hey Sampada 💕
          </h1>

          <p 
            className="fade-in-subheading"
            style={{
            fontSize: "2rem",
            color: "#8b3a3a",
            margin: "0 0 80px 0",
            letterSpacing: "1px",
            textAlign: "center",
            fontWeight: 400,
            maxWidth: "600px",
            lineHeight: "1.6"
          }}>
            Will you be my Valentine?
          </p>

          <div style={{
            display: "flex",
            gap: "40px",
            justifyContent: "center"
          }}>
            <button
              onClick={() => {
                // Create confetti burst
                for (let i = 0; i < 50; i++) {
                  const confetti = document.createElement("div");
                  confetti.className = "confetti-piece";
                  confetti.textContent = ["❤️", "💕", "✨", "💖"][Math.floor(Math.random() * 4)];
                  confetti.style.left = "50%";
                  confetti.style.top = "50%";
                  confetti.style.setProperty("--tx", `${(Math.random() - 0.5) * 400}px`);
                  confetti.style.setProperty("--ty", `${(Math.random() - 0.5) * 400}px`);
                  confetti.style.fontSize = `${1 + Math.random() * 1.5}rem`;
                  document.body.appendChild(confetti);
                  setTimeout(() => confetti.remove(), 1500);
                }
                // Delay transition for confetti effect
                setTimeout(() => setAcceptedValentine(true), 800);
              }}
              className="pulse-button"
              style={{
                padding: "16px 50px",
                fontSize: "1.3rem",
                background: "linear-gradient(135deg, #d4698f, #c85b77)",
                color: "white",
                border: "none",
                borderRadius: "50px",
                cursor: "pointer",
                fontFamily: "Playfair Display, serif",
                fontWeight: 500,
                letterSpacing: "1px",
                transition: "all 0.4s ease",
                boxShadow: "0 10px 30px rgba(212, 105, 105, 0.3)"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "scale(1.05)";
                e.target.style.boxShadow = "0 15px 40px rgba(212, 105, 105, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "0 10px 30px rgba(212, 105, 105, 0.3)";
              }}
            >
              Yes ❤️
            </button>

            <button
              disabled
              style={{
                padding: "16px 50px",
                fontSize: "1.3rem",
                background: "#e0e0e0",
                color: "#999",
                border: "none",
                borderRadius: "50px",
                cursor: "not-allowed",
                fontFamily: "Playfair Display, serif",
                fontWeight: 500,
                letterSpacing: "1px",
                opacity: 0.5
              }}
            >
              No
            </button>
          </div>
        </div>
      ) : (
        <>
          <Canvas
            camera={{ position: [0, 5, 20], fov: 70 }}
            style={{ background: "#f7e7da" }}
          >
            <ScrollControls pages={8} damping={0.1}>
              <Suspense fallback={null}>
                <Scene checkpoint={checkpoint} />
              </Suspense>
            </ScrollControls>
          </Canvas>

      <HeroUI />

      {checkpoint === 0 && (
        <CuteQuestion
          question="Which gift instantly brings the brightest smile to her face?"
          options={[
            "Chocolates",
            "Flowers",
            "Teddy bear"
          ]}
          correctIndex={1}
          onCorrect={() => setCheckpoint(1)}
        />
      )}

      {checkpoint === 1 && (
        <CuteQuestion
          question="When it comes to winning her heart instantly, which flavor never fails?"
          options={[
            "Chocolate",
            "Vanilla",
            "Strawberry"
          ]}
          correctIndex={2}
          onCorrect={() => setCheckpoint(2)}
        />
      )}

      {checkpoint === 2 && (
        <CuteQuestion
          question="What is the one thing that turns any ordinary day into something magical?"
          options={[
            "Good weather",
            "Favorite food",
            " Everything with you ✨"
          ]}
          correctIndex={2}
          onCorrect={() => setCheckpoint(3)}
        />
      )}

      {checkpoint === 3 && (
        <div style={{
          position: "absolute",
          bottom: "15%",
          width: "100%",
          textAlign: "center",
          fontFamily: "Playfair Display, serif",
          color: "#4a2c1d",
          zIndex: 10
        }}>
          {/* Dense Floating Hearts */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="floating-heart"
              style={{
                left: `${Math.random() * 100}%`,
                animationDuration: `${6 + Math.random() * 6}s`,
                animationDelay: `${i * 0.3}s`,
                fontSize: `${1.5 + Math.random() * 1.5}rem`
              }}
            >
              ❤️
            </div>
          ))}
          <h1 style={{ fontSize: "3rem", margin: "0 0 20px 0" }}>Happy Valentine's Day ❤️</h1>
          <p style={{ fontSize: "1.2rem", lineHeight: "1.6" }}>
            With you, every place feels like Paris.<br />
            And every moment feels like forever.
          </p>
        </div>
      )}
        </>
      )}
    </div>
  );
}

function CuteQuestion({ question, options, correctIndex, onCorrect }) {
  const [selected, setSelected] = useState(null);

  const handleClick = (index) => {
    setSelected(index);

    if (index === correctIndex) {
      setTimeout(() => {
        onCorrect();
      }, 800); // small delay for smooth feeling
    }
  };

  return (
    <div style={{
      position: "absolute",
      top: "45%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      padding: "50px 70px",
      borderRadius: "25px",
      backdropFilter: "blur(20px)",
      background: "rgba(255, 255, 255, 0.5)",
      boxShadow: "0 30px 80px rgba(210, 105, 105, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.5)",
      textAlign: "center",
      fontFamily: "Playfair Display, serif",
      color: "#8b3a3a",
      maxWidth: "700px",
      border: "2px solid rgba(255, 192, 203, 0.3)"
    }}>
      <h2 style={{ 
        fontWeight: 500, 
        fontSize: "2.1rem", 
        margin: "0 0 40px 0",
        letterSpacing: "0.5px",
        background: "linear-gradient(135deg, #d4698f, #c85b77)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text"
      }}>
        {question}
      </h2>

      <div style={{ marginTop: "30px" }}>
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            style={{
              margin: "14px",
              padding: "14px 32px",
              borderRadius: "45px",
              border: "2px solid " + (selected === i 
                ? i === correctIndex 
                  ? "#f5a7a7" 
                  : "#ddd"
                : "rgba(212, 105, 105, 0.2)"),
              background: selected === i
                ? i === correctIndex
                  ? "linear-gradient(135deg, #ffb6c1, #ffc0cb)"
                  : "#f5f5f5"
                : "rgba(255, 255, 255, 0.7)",
              cursor: "pointer",
              transition: "all 0.4s ease",
              fontFamily: "Playfair Display, serif",
              fontSize: "1rem",
              color: "#8b3a3a",
              fontWeight: 500,
              boxShadow: selected === i && i === correctIndex 
                ? "0 10px 30px rgba(212, 105, 105, 0.3)" 
                : "none"
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

