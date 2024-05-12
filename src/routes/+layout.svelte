<script lang="ts">
	import '../app.css';
	import { Button, Card, Input, Label, Helper } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import {
		offsetX,
		offsetY,
		setSvgElement,
		startPan,
		updateInitialOffsets,
		scale,
		handleZoom
	} from '$lib/utils/panningLogic';
	import { regenerate, type Node, type Link } from '$lib/utils/fcnn';
	import { layerConfig } from '$lib/utils/fcnn';
	import { svgElement } from '$lib/stores/svgStore';

	export function downloadSvg() {
		const svg = get(svgElement);
		console.log($svgElement);
		if (svg) {
			const serializer = new XMLSerializer();
			const svgBlob = new Blob([serializer.serializeToString(svg)], {
				type: 'image/svg+xml;charset=utf-8'
			});

			const url = URL.createObjectURL(svgBlob);

			const downloadLink = document.createElement('a');
			downloadLink.href = url;
			downloadLink.download = 'network-visualization.svg';
			document.body.appendChild(downloadLink);
			downloadLink.click();
			document.body.removeChild(downloadLink);
			URL.revokeObjectURL(url); // Clean up the URL object
		}
	}

	function deleteLayer(index: number) {
		console.log('Deleting layer', index);
		layerConfig.update((layers) => {
			layers.splice(index, 1);

			// Fix following layer ids
			for (let i = index; i < layers.length; i++) {
				layers[i].layer = i;
			}

			return layers;
		});
	}
	function addLayer() {
		layerConfig.update((layers) => {
			layers.push({ layer: layers.length, nodes: newLayerNodes || null });
			newLayerNodes = undefined;
			return layers;
		});
	}
	let newLayerNodes: number | undefined = undefined;

	function centerView() {
		updateInitialOffsets();
	}
	function resetView() {
		updateInitialOffsets();
		scale.set(1);
	}
	const circleRadius = 15;

	let localSvgElement: SVGElement;

	let nodes: Node[] = [];
	let links: Link[] = [];

	// Node and link definitions
	$: $layerConfig, ({ nodes, links } = regenerate(nodes, links, layerConfig));
	$: $layerConfig, console.log($layerConfig);

	$: onMount(() => {
		setSvgElement(localSvgElement);
		svgElement.set(localSvgElement);
	});

	let num_layers = 4;
</script>

<main class="h-screen w-screen bg-white dark:bg-gray-900">
	<div
		class="fixed left-4 top-4 max-w-sm divide-gray-200 rounded-lg border border-gray-200 bg-white text-gray-500 shadow-md sm:p-8 dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
	>
		<form class="no-scrollbar -mr-2 h-full space-y-2 overflow-y-scroll pr-4" action="#">
			<h4 class="text-2xl font-semibold text-gray-900 dark:text-white">
				Network <mark class="rounded bg-blue-600 px-2 italic text-white dark:bg-blue-500">Viz</mark>
			</h4>
			<p class="text-base font-normal text-gray-500 dark:text-gray-400">
				Heavily inspired by
				<a href="#" class="font-medium text-blue-600 hover:underline dark:text-blue-500">NN-SVG</a>
				by
				<a href="#" class="font-medium text-blue-600 hover:underline dark:text-blue-500"
					>Alex Lenail</a
				>.
			</p>
			<!-- Tab Bar -->
			<div
				class="border-b border-gray-200 pt-4 text-center text-sm font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400"
			>
				<ul class="-mb-px flex flex-wrap">
					<li class="me-2">
						<a
							href="#"
							class="active inline-block rounded-t-lg border-b-2 border-blue-600 p-2 text-blue-600 dark:border-blue-500 dark:text-blue-500"
							aria-current="page">FCNN</a
						>
					</li>
					<li class="me-2">
						<a
							href="#"
							class="inline-block rounded-t-lg border-b-2 border-transparent p-2 hover:border-gray-300 hover:text-gray-600 dark:hover:text-gray-300"
							>LeNet</a
						>
					</li>
					<li class="me-2">
						<a
							href="#"
							class="inline-block cursor-not-allowed rounded-t-lg p-2 text-gray-400 dark:text-gray-500"
							>AlexNet</a
						>
					</li>
					<li>
						<a
							class="inline-block cursor-not-allowed rounded-t-lg p-2 text-gray-400 dark:text-gray-500"
							>Transformer</a
						>
					</li>
				</ul>
			</div>
			<!-- Tab Content -->

			<!-- Architecture -->
			<h5 class="pt-4 text-xl font-medium text-black dark:text-white">Architecture</h5>
			<Label>Enter the vectors per layer</Label>
			{#each Array($layerConfig.length) as _, i}
				<div class="flex items-center space-x-2">
					<Button
						color="light"
						size="sm"
						class="h-8 w-8 border-none p-2 text-gray-400  hover:text-red-500 dark:text-gray-400"
						on:click={() => deleteLayer(i)}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="icon icon-tabler icons-tabler-outline icon-tabler-trash"
							><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 7l16 0" /><path
								d="M10 11l0 6"
							/><path d="M14 11l0 6" /><path
								d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"
							/><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg
						>
					</Button>
					<Input
						type="number"
						placeholder="0"
						size="md"
						bind:value={$layerConfig[i].nodes}
						required
					/>
				</div>
			{/each}

			<div class="flex items-center space-x-2">
				<Button color="blue" size="sm" class="h-8 w-8 border-none p-2" on:click={addLayer}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="icon icon-tabler icons-tabler-outline icon-tabler-plus"
						><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 5l0 14" /><path
							d="M5 12l14 0"
						/></svg
					>
				</Button>
				<Input type="number" placeholder="0" size="md" required bind:value={newLayerNodes} />
			</div>

			<!-- Form Inputs -->
		</form>
	</div>

	<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
	<div
		on:mousedown={startPan}
		on:wheel={handleZoom}
		class="h-full w-full cursor-grab overflow-hidden active:cursor-grabbing"
		role="application"
	>
		<svg w="200" h="200" class="h-full w-full" bind:this={localSvgElement}>
			<g transform="translate({$offsetX}, {$offsetY}) scale({$scale})">
				{#each links as link}
					<line
						x1={nodes.find((n) => n.id === link.source).cx}
						y1={nodes.find((n) => n.id === link.source).cy}
						x2={nodes.find((n) => n.id === link.target).cx}
						y2={nodes.find((n) => n.id === link.target).cy}
						style="stroke-width: 0.5; stroke-opacity: 1; stroke: rgb(80, 80, 80); fill: none;"
					/>
				{/each}
				{#each nodes as node}
					<circle
						cx={node.cx}
						cy={node.cy}
						r={circleRadius}
						style="fill: rgb(255, 255, 255); stroke: rgb(51, 51, 51);"
					/>
				{/each}
			</g>
		</svg>
	</div>

	<div class="fixed bottom-4 right-4 space-x-2">
		<Button color="red" size="md" on:click={resetView}>Reset</Button>
		<Button color="light" size="md" on:click={centerView}>Center</Button>
		<Button color="primary" size="md" on:click={downloadSvg}>Save</Button>
	</div>
</main>
