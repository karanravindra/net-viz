import { get, writable } from 'svelte/store';

// Exporting as stores for reactivity
export const offsetX = writable<number>(0);
export const offsetY = writable<number>(0);
export const scale = writable<number>(1.0); // Store for the zoom scale

export let svgElement: SVGElement | null = null;

// Function to set the SVG element
export function setSvgElement(element: SVGElement) {
	svgElement = element;
	updateInitialOffsets();
}

// Calculate initial centering
export function updateInitialOffsets() {
	if (svgElement) {
		const svgWidth = svgElement.clientWidth;
		const svgHeight = svgElement.clientHeight;
		const initialOffsetX = svgWidth / 2; // Center X
		const initialOffsetY = svgHeight / 2; // Center Y
		offsetX.set(initialOffsetX);
		offsetY.set(initialOffsetY);
		scale.set(1.0);
	}
}

// Panning logic
export function startPan(event: MouseEvent): void {
	let startX = event.clientX;
	let startY = event.clientY;

	offsetX.update((currentX) => {
		startX -= currentX;
		return currentX;
	});

	offsetY.update((currentY) => {
		startY -= currentY;
		return currentY;
	});

	function doPan(event: MouseEvent): void {
		offsetX.set(event.clientX - startX);
		offsetY.set(event.clientY - startY);
	}

	function endPan(): void {
		window.removeEventListener('mousemove', doPan);
		window.removeEventListener('mouseup', endPan);
	}

	window.addEventListener('mousemove', doPan);
	window.addEventListener('mouseup', endPan);
}

// Zoom logic
export function handleZoom(event: WheelEvent): void {
	event.preventDefault();
	const zoomIntensity = 0.1;
	const oldScale = get(scale); // Use 'get' from Svelte store to get the current value synchronously
	const cursorX = event.clientX;
	const cursorY = event.clientY;

	// Compute new scale based on the direction of the scroll
	const newScale =
		event.deltaY < 0 ? oldScale * (1 + zoomIntensity) : oldScale * (1 - zoomIntensity);

	// Adjust offset based on new scale and cursor position
	const newOffsetX = cursorX - (cursorX - get(offsetX)) * (newScale / oldScale);
	const newOffsetY = cursorY - (cursorY - get(offsetY)) * (newScale / oldScale);

	// Update the scale and offset stores
	if (newScale < 0.1 || newScale > 10) return;

	scale.set(newScale);
	offsetX.set(newOffsetX);
	offsetY.set(newOffsetY);
}
