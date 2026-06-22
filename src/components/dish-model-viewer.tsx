"use dom";

import { dishModelData } from "@/data/dish-model-data";
import { DishModelId } from "@/data/dish-models";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

function decodeModel(dataUri: string) {
  const encoded = dataUri.slice(dataUri.indexOf(",") + 1);
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

export default function DishModelViewer({
  dishId,
  dom: _dom,
}: {
  dishId: DishModelId;
  dom?: import("expo/dom").DOMProps;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    setStatus("loading");
    let animationFrame = 0;
    let disposed = false;
    let model: THREE.Object3D | null = null;
    let modelRadius = 0;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x27313d, 2.4));
    const keyLight = new THREE.DirectionalLight(0xffffff, 4.2);
    keyLight.position.set(4, 7, 6);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xf2c14e, 2);
    fillLight.position.set(-5, 3, -4);
    scene.add(fillLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.4;

    const fitCamera = () => {
      if (!modelRadius) {
        return;
      }

      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
      const limitingFov = Math.min(verticalFov, horizontalFov);
      const fitDistance = (modelRadius / Math.sin(limitingFov / 2)) * 1.18;
      camera.position.copy(new THREE.Vector3(1.25, 0.85, 1.8).normalize().multiplyScalar(fitDistance));
      controls.minDistance = fitDistance * 0.55;
      controls.maxDistance = fitDistance * 2.5;
      controls.target.set(0, 0, 0);
      controls.update();
    };

    const resize = () => {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      fitCamera();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const render = () => {
      controls.update();
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(render);
    };
    render();

    try {
      new GLTFLoader().parse(
        decodeModel(dishModelData[dishId]),
        "",
        (gltf) => {
          if (disposed) {
            return;
          }

          model = gltf.scene;
          const bounds = new THREE.Box3().setFromObject(model);
          const size = bounds.getSize(new THREE.Vector3());
          const center = bounds.getCenter(new THREE.Vector3());
          const radius = Math.max(size.x, size.y, size.z) * 0.5 || 1;
          modelRadius = radius;
          model.position.sub(center);
          scene.add(model);

          camera.near = Math.max(radius / 100, 0.01);
          camera.far = radius * 100;
          camera.updateProjectionMatrix();
          fitCamera();
          renderer.render(scene, camera);
          setStatus("ready");
        },
        () => {
          if (!disposed) {
            setStatus("error");
          }
        },
      );
    } catch {
      setStatus("error");
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      controls.dispose();
      model?.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) {
          return;
        }
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [dishId]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 50% 42%, rgba(78,92,105,0.55), rgba(5,8,13,0.96) 62%)",
      }}
    >
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      {status !== "ready" ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            color: "#ffffff",
            background: "rgba(5,8,13,0.72)",
            font: "800 16px system-ui, sans-serif",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          {status === "error" ? "Не удалось открыть 3D-модель" : "Загрузка 3D-модели…"}
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 20,
          bottom: 18,
          borderRadius: 8,
          padding: "9px 12px",
          color: "#f4f7fa",
          background: "rgba(5,8,13,0.72)",
          font: "700 13px system-ui, sans-serif",
          pointerEvents: "none",
        }}
      >
        Модель вращается автоматически · Вращайте одним пальцем · Масштабируйте двумя
      </div>
    </div>
  );
}
