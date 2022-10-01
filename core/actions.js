import { camelToDashed, clone } from '../shared/utils.js';

const ShowModal = (modal, data) => {
	const event = new CustomEvent('contextMenuShow', {
		bubbles: true,
		detail: {
			modal,
			list: [],
			data,
			parent: "core"
		}
	});
	window.top.dispatchEvent(event);
};

const SelectedLayer = (context) => {
	const { host, currentFile } = context;
	const { layers } = currentFile;
	const selectedLayer = layers.find(x => x.selected);
	return selectedLayer;
}

const layerAlpha = async (context, args) => {
	const { update, currentFile } = context;
	const { number, alpha } = args;
	const { layers } = currentFile;
	const l = layers.find(x => x.number === Number(number));
	l.alpha = alpha;
	context.state.layer.update(l.id, l);
	l.dirty = true;
	await update();
	l.dirty = undefined;
};
const layerBlendMode = async (context, args) => {
	const { update, currentFile } = context;
	const { number, mode } = args;
	const { layers } = currentFile;
	const l = layers.find(x => x.number === Number(number));
	l.blendMode = mode;
	context.state.layer.update(l.id, l);
	l.dirty = true;
	await update();
	l.dirty = undefined;
};
const layerSelect = async (context, args) => {
	const { update, currentFile } = context;
	const { number } = args;
	const { layers } = currentFile;
	let selectId;
	for(const layer of layers){
		layer.selected = undefined;
		if(layer.number !== number) continue;
		layer.selected = true;
		selectId = layer.id;
	}
	context.state.layer.select(selectId);
	await update();
};
const layerVisibility = async (context, args) => {
	const { update, currentFile } = context;
	const { number, visible } = args;
	const { layers } = currentFile;
	const l = layers.find(x => x.number === Number(number));
	l.visible = visible;
	context.state.layer.update(l.id, { visible });
	l.dirty = true;
	await update();
	l.dirty = undefined;
};
const layerNew = async (context, args) => {
	const { layout } = context;
	layout.showPane({ name: "editor" });
};
const layerAdd = async (context, args) => {
	const { def, name, type } = args;
	const { update, currentFile } = context;
	const { layers } = currentFile;
	layers.forEach(x => {
		x.number+=1;
		x.selected = false;
	});
	currentFile.dirty = true;
	const l = {
		def, name, type,
		number: 0,
		selected: true
	};
	layers.push(l);
	context.state.layer.add(l);
	l.dirty = true;
	await update();
	l.dirty = undefined;
	currentFile.dirty = undefined;
};
const layerDelete = async (context, args) => {
	const { update, currentFile } = context;
	const { number } = args;
	const { id } = currentFile.layers
		.find(x => x.number === number);
	currentFile.layers = currentFile.layers
		.filter(x => x.number !== number)
		.sort((a,b) => a.number-b.number)
		.map((o,i) => {
			o.selected = false;
			o.number = i;
			return o;
		});
	currentFile.layers[0].selected = true;
	context.state.layer.remove(id);
	currentFile.dirty = true;
	await update();
	currentFile.dirty = undefined;
};
const layerDuplicate = async (context, args) => {
	const { update, currentFile } = context;
	const clonedLayer = clone(args);
	clonedLayer.selected = false;
	clonedLayer.name += ' (copy)';
	clonedLayer.number += -0.1;
	currentFile.layers.push(clonedLayer);
	currentFile.layers = currentFile.layers
		.sort((a,b) => a.number-b.number)
		.map((o,i) => {
			o.number = i;
			return o;
		});
	context.state.layer.duplicate(args.id);
	currentFile.dirty = true;
	await update();
	currentFile.dirty = undefined;
};
const layerUpdate = async (context, args) => {
	const layer = args;
	const { update, currentFile } = context;
	const { layers } = currentFile;
	const l = layers.find(x => x.number === Number(layer.number));
	if(!l) return console.error('could not find layer to update');
	layer.def && (l.def = layer.def);
	layer.name && (l.name = layer.name);
	context.state.layer.update(l.id, l);
	l.dirty = true;
	await update();
	l.dirty = undefined;
};
const showLayerSource = async (context, args) => {
	const { layout } = context;
	layout.showPane({ name: "editor" })
};
const hideLayerSource = async (context, args) => {
	const { layout } = context;
	layout.hidePane({ name: "editor" })
};
const layersOrder = async (context, args) => {
	const { order } = args;
	const { update, currentFile } = context;
	const { layers } = currentFile;
	for(const [i, o] of Object.entries(order)){
		layers[o].number = Number(i);
	}
	currentFile.layers = currentFile.layers.sort((a,b) => a.number-b.number);
	context.state.layer.order(currentFile.layers.map(x => x.id));
	currentFile.dirty = true;
	await update();
	currentFile.dirty = undefined;
};

const menuLayerNew = async (context) => {
	const { host } = context;
	const newLayer = {};
	await host.broadcast({
		eventName: 'layer-new',
		type: 'layer-new',
		data: newLayer,
	});
	await layerNew(context, newLayer);
};
const menuShowLayerSource = async (context) => {
	const { host } = context;
	const selectedLayer = SelectedLayer(context);
	await host.broadcast({
		eventName: 'show-layer-source',
		type: 'show-layer-source',
		data: selectedLayer,
	});
	await showLayerSource(context, selectedLayer);
};
const menuImageSize = async (context) => {
	const { currentFile } = context;
	const { width, height } = currentFile;
	ShowModal('imageSize', { width, height });
};
const menuLayerDuplicate = async (context) => {
	const selectedLayer = SelectedLayer(context);
	await layerDuplicate(context, selectedLayer);
};
const menuLayerDelete = async (context) => {
	const selectedLayer = SelectedLayer(context);
	await layerDelete(context, selectedLayer);
};

const actions = {
	layerAlpha,
	layerBlendMode,
	layerNew,
	layerAdd,
	layerSelect,
	layerVisibility,
	layerUpdate,
	showLayerSource,
	hideLayerSource,
	layersOrder,

	menuLayerNew,
	menuShowLayerSource,
	menuImageSize,
	menuLayerDuplicate,
	menuLayerDelete,
};

const camelPropsAsDashed = obj => Object.entries(obj)
	.reduce((all, [k,v]) => ({
		...all,
		[camelToDashed(k)]: v
	}), {})

export default camelPropsAsDashed(actions);
