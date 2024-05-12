import { writable, type Writable } from 'svelte/store';

// TypeScript types
export type Node = {
	id: number;
	cx: number;
	cy: number;
	layer: number;
};

export type Link = {
	source: number;
	target: number;
};

export const xOffset = 100; // Initial X offset
export const vSpacing = 50; // vertical spacing between nodes
export const hSpacing = 200; // horizontal spacing between nodes

export const layerConfig = writable<{ layer: number; nodes: number | null }[]>([
	// Example configuration for a fully connected neural network
	{ layer: 0, nodes: 16 },
	{ layer: 1, nodes: 12 },
	{ layer: 2, nodes: 10 },
	{ layer: 3, nodes: 1 }
]);

export function generateNodes(
	layerConfig: Writable<{ layer: number; nodes: number | null }[]>
): Node[] {
	const nodes: Node[] = [];
	let id = 0;

	// Function to calculate the vertical start position for centering nodes in a layer
	function calculateStartY(numNodes: number): number {
		const totalHeight = (numNodes - 1) * vSpacing;
		return 0 - totalHeight / 2; // 150 is an example midpoint of the SVG canvas vertically
	}

	// Function to calculate the horizontal start position for centering nodes in a layer
	function calculateStartX(numLayers: number): number {
		const totalWidth = (numLayers - 1) * hSpacing;
		return xOffset - totalWidth / 2; // 150 is an example midpoint of the SVG canvas horizontally
	}

	// Generate nodes for each layer based on the configuration
	layerConfig.subscribe((config) => {
		config.forEach((layer) => {
			if (layer.nodes === null) return;

			const startX = calculateStartX(config.length);
			const startY = calculateStartY(layer.nodes);

			for (let i = 0; i < layer.nodes; i++) {
				nodes.push({
					id: id,
					cx: startX + layer.layer * hSpacing,
					cy: startY + i * vSpacing,
					layer: layer.layer
				});
				id++;
			}
		});
	});

	return nodes;
}

// Generate links
export function generateLinks(nodes: Node[]): Link[] {
	const links: Link[] = [];

	for (let i = 0; i < nodes.length; i++) {
		for (let j = 0; j < nodes.length; j++) {
			if (nodes[i].layer + 1 === nodes[j].layer) {
				links.push({
					source: nodes[i].id,
					target: nodes[j].id
				});
			}
		}
	}

	return links;
}

export function regenerate(
	nodes: Node[],
	links: Link[],
	layerConfig: Writable<{ layer: number; nodes: number | null }[]>
) {
	const layers = layerConfig;
	nodes = generateNodes(layers);
	links = generateLinks(nodes);

	return { nodes, links };
}
