import "./app.css";
import { mount } from "svelte";
import NativeFeasibilityApp from "./NativeFeasibilityApp.svelte";

const target = document.getElementById("app");
if (!target) throw new Error("Minecraft Instance Manager UI root element is missing.");

mount(NativeFeasibilityApp, { target });
