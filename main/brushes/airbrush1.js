import ink from './inky1.js';

export default (ctx, radius, path) => {
	ctx.filter = "blur(40px)";
	//ctx.globalAlpha = .3;
	ink(ctx, 10, path);
};
