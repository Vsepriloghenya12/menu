"use dom";

import "@google/model-viewer";
import React from "react";

const modelSource = require("../../assets/models/IridescentDishWithOlives.glb");

export default function DishModelViewer({
  dom: _dom,
}: {
  dom?: import("expo/dom").DOMProps;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 50% 42%, rgba(78,92,105,0.55), rgba(5,8,13,0.96) 62%)",
      }}
    >
      {React.createElement("model-viewer", {
        src: modelSource,
        alt: "Демонстрационная 3D-модель блюда",
        "camera-controls": true,
        "touch-action": "pan-y",
        "interaction-prompt": "auto",
        "shadow-intensity": "1.2",
        "shadow-softness": "0.8",
        exposure: "1.05",
        "environment-image": "neutral",
        "camera-orbit": "35deg 68deg auto",
        "min-camera-orbit": "auto 20deg 65%",
        "max-camera-orbit": "auto 155deg 220%",
        style: {
          width: "100%",
          height: "100%",
          display: "block",
          outline: "none",
        },
      })}
      <div
        style={{
          position: "fixed",
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
        Вращайте одним пальцем · Масштабируйте двумя
      </div>
    </div>
  );
}
