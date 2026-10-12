import "./app.css";
import { mount } from "svelte";
import NativeFeasibilityApp from "./NativeFeasibilityApp.svelte";

const target = document.getElementById("app");
if (!target) throw new Error("Virtual Clients UI root element is missing.");

mount(NativeFeasibilityApp, { target });
