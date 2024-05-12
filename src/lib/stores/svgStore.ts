// svgStore.ts
import { writable } from 'svelte/store';

export const svgElement = writable<SVGElement | null>(null);
