import { log } from "./utils";
import { writable } from "svelte/store";
export const userLoggedIn = writable(false);
export const user = writable({});