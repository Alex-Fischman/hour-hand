let context = document.getElementById("canvas").getContext("2d");

let Vec = function(x, y) { this.x = x; this.y = y; };
Vec.prototype.add = function({x, y}) { return new Vec(this.x + x, this.y + y); };
Vec.prototype.sub = function({x, y}) { return new Vec(this.x - x, this.y - y); };
Vec.prototype.mul = function(s) { return new Vec(this.x * s, this.y * s); };
Vec.prototype.eql = function({x, y}) { return this.x === x && this.y === y; };
Vec.prototype.moveTo = function() { context.moveTo(this.x, this.y); };
Vec.prototype.lineTo = function() { context.lineTo(this.x, this.y); };

let input = {
	x: 0, y: 0,
	pressed: false,
	vec: function() { return context.getTransform().inverse()
		.transformPoint(new DOMPoint(this.x, this.y)); },
};
let handlePointerEvent = e => {
	input.x = e.x;
	input.y = e.y;
	input.pressed = !!e.pressure;
};
document.addEventListener("pointerup", handlePointerEvent);
document.addEventListener("pointerdown", handlePointerEvent);
document.addEventListener("pointermove", handlePointerEvent);

const GRAVITY = 10;
const ANGULAR = 2;

let pos = 1;
let vel = 0;
let rot = 0;
let score = 0;

let blocks = [new Vec(0.5, -0.5), new Vec(-0.5, 0.5), new Vec(0.2, 0.6), new Vec(-0.6, -0.2)];
let goals = [new Vec(0.8, -0.8), new Vec(-0.7, 0.9), new Vec(-0.9, 0.7)];
let collision = square => {
	const cx = Math.cos(-rot) * pos;
	const cy = Math.sin(-rot) * pos;
	const dx = Math.abs(cx - square.x);
    const dy = Math.abs(cy - square.y);
    if (dx >= 0.2 || dy >= 0.2) return false;
    if (dx < 0.1 || dy < 0.1) return true;
    const d2 = (dx - 0.1) ^ 2 + (dy - 0.1) ^ 2;
    return d2 <= 0.1^2;
};

let update = dt => {
	vel += pos * -GRAVITY * dt;
	pos += vel * dt;
	if (input.pressed) rot += ANGULAR * dt;
};

let render = () => {
	let {width: w, height: h} = context.canvas.getBoundingClientRect();
	context.canvas.width = w;
	context.canvas.height = h;
	context.fillStyle = "#EEE";
	context.fillRect(0, 0, w, h);
	context.setTransform(new DOMMatrix(w > h? 
		[h / 2, 0, 0, -h / 2, h / 2 + (w - h) / 2, h / 2]: 
		[w / 2, 0, 0, -w / 2, w / 2, w / 2 + (h - w) / 2]
	));
	context.lineJoin = "round";
	context.lineCap = "round";
	
	context.lineWidth = 0.2;
	context.strokeStyle = "#DDD";
	context.rotate(-rot);
	context.beginPath();
	context.moveTo(1, 0);
	context.lineTo(-1, 0);
	context.stroke();
	context.rotate(rot);

	for (const block of blocks) {
		context.fillStyle = "#811";
		if (collision(block)) {
			context.fillStyle = "#E11";
			if (!block.cooldown) {
				score -= 1;
				block.cooldown = true;
			}
		} else if (block.cooldown) {
			block.cooldown = false;
		}
		context.fillRect(block.x - 0.1, block.y - 0.1, 0.2, 0.2);
	}
	for (const goal of goals) {
		context.fillStyle = "#181";
		if (collision(goal)) {
			context.fillStyle = "#1E1";
			if (!goal.cooldown) {
				score += 1;
				goal.cooldown = true;
			}
		} else if (goal.cooldown) {
			goal.cooldown = false;
		}
		context.fillRect(goal.x - 0.1, goal.y - 0.1, 0.2, 0.2);
	}
	
	context.fillStyle = "#111";
	context.rotate(-rot);
	context.beginPath();
	context.arc(pos, 0, 0.1, 0, 2 * Math.PI);
	context.fill();
	context.rotate(rot);

	context.scale(1, -1);
	context.fillStyle = "#111";
	context.textAlign = "center";
	context.font = "0.1px monospace";
	context.fillText(`Score: ${score}`, 0, 0.98);
	context.scale(1, -1);
};

let then = performance.now(), load = performance.now();
let frame = now => {
	let dt = now - then;
	then = now;
	update(dt / 1000);
	render();
	if (now - load < 500) {
		context.fillStyle = `rgba(255, 255, 255, ${1 - (now - load) / 500})`;
		let {width: w, height: h} = context.canvas.getBoundingClientRect();
		let a = context.getTransform().inverse().transformPoint(new DOMPoint(0, 0));
		let b = context.getTransform().inverse().transformPoint(new DOMPoint(w, h));
		context.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
	}
	window.requestAnimationFrame(frame);
};
window.requestAnimationFrame(frame);
