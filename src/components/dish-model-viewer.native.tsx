import { DishModelId } from "@/data/dish-models";
import { Canvas, useFrame, useLoader } from "@react-three/fiber/native";
import "expo-gl";
import React, { Suspense, useMemo, useRef } from "react";
import { PanResponder, StyleSheet, Text, View } from "react-native";
import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const modelSources: Record<DishModelId, number> = {
  bruschetta: require("../../assets/models/Bruschetta.glb"),
  "shrimp-pasta": require("../../assets/models/ShrimpPasta.glb"),
  fondant: require("../../assets/models/ChocolateFondant.glb"),
};

type RotationState = {
  active: boolean;
  pitch: number;
  scale: number;
  yaw: number;
};

function distance(
  first: { pageX: number; pageY: number },
  second: { pageX: number; pageY: number },
) {
  return Math.hypot(second.pageX - first.pageX, second.pageY - first.pageY);
}

function DishModel({
  dishId,
  rotation,
}: {
  dishId: DishModelId;
  rotation: React.MutableRefObject<RotationState>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useLoader(
    GLTFLoader,
    modelSources[dishId] as unknown as string,
  ) as GLTF;
  const model = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const bounds = new THREE.Box3().setFromObject(scene);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const largestSide = Math.max(size.x, size.y, size.z) || 1;

    scene.position.sub(center);
    scene.scale.setScalar(3.8 / largestSide);
    return scene;
  }, [gltf.scene]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    if (!rotation.current.active) {
      rotation.current.yaw += delta * 0.45;
    }
    group.rotation.set(rotation.current.pitch, rotation.current.yaw, 0);
    group.scale.setScalar(rotation.current.scale);
  });

  return (
    <group ref={groupRef}>
      <primitive object={model} />
    </group>
  );
}

export default function DishModelViewer({
  dishId,
  dom: _dom,
}: {
  dishId: DishModelId;
  dom?: import("expo/dom").DOMProps;
}) {
  const rotation = useRef<RotationState>({
    active: false,
    pitch: 0,
    scale: 1,
    yaw: 0,
  });
  const gesture = useRef({
    distance: 0,
    pitch: 0,
    scale: 1,
    startX: 0,
    startY: 0,
    yaw: 0,
  });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const touches = event.nativeEvent.touches;
          rotation.current.active = true;
          gesture.current = {
            distance: touches.length >= 2 ? distance(touches[0], touches[1]) : 0,
            pitch: rotation.current.pitch,
            scale: rotation.current.scale,
            startX: touches[0]?.pageX ?? 0,
            startY: touches[0]?.pageY ?? 0,
            yaw: rotation.current.yaw,
          };
        },
        onPanResponderMove: (event) => {
          const touches = event.nativeEvent.touches;
          if (touches.length >= 2) {
            const nextDistance = distance(touches[0], touches[1]);
            if (gesture.current.distance > 0) {
              rotation.current.scale = THREE.MathUtils.clamp(
                gesture.current.scale * (nextDistance / gesture.current.distance),
                0.65,
                1.8,
              );
            }
            return;
          }

          const touch = touches[0];
          if (!touch) {
            return;
          }
          rotation.current.yaw =
            gesture.current.yaw + (touch.pageX - gesture.current.startX) * 0.012;
          rotation.current.pitch = THREE.MathUtils.clamp(
            gesture.current.pitch + (touch.pageY - gesture.current.startY) * 0.008,
            -0.75,
            0.75,
          );
        },
        onPanResponderRelease: () => {
          rotation.current.active = false;
        },
        onPanResponderTerminate: () => {
          rotation.current.active = false;
        },
      }),
    [],
  );

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Canvas camera={{ fov: 38, position: [4.8, 3.1, 6.8] }}>
        <color attach="background" args={["#080d13"]} />
        <ambientLight intensity={1.8} />
        <hemisphereLight args={["#ffffff", "#27313d", 2.8]} />
        <directionalLight intensity={4.2} position={[4, 7, 6]} />
        <directionalLight color="#f2c14e" intensity={2} position={[-5, 3, -4]} />
        <Suspense fallback={null}>
          <DishModel dishId={dishId} rotation={rotation} />
        </Suspense>
      </Canvas>
      <View pointerEvents="none" style={styles.hint}>
        <Text style={styles.hintText}>
          Модель вращается автоматически · Вращайте одним пальцем · Масштабируйте двумя
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#080d13",
    flex: 1,
    overflow: "hidden",
  },
  hint: {
    backgroundColor: "rgba(5, 8, 13, 0.78)",
    borderRadius: 8,
    bottom: 18,
    left: 20,
    maxWidth: "88%",
    paddingHorizontal: 12,
    paddingVertical: 9,
    position: "absolute",
  },
  hintText: {
    color: "#f4f7fa",
    fontSize: 13,
    fontWeight: "700",
  },
});
