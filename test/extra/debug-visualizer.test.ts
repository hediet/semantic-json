import {
	sString,
	sLiteral,
	sUnionMany,
	sIntersect,
	sOpenObject,
} from "../../src";

it("intersection debug visualizer", () => {
	class Text {
		public readonly tag = "text";

		constructor(public readonly text: string) {}

		toString() {
			return "Text";
		}
	}

	class Svg {
		public readonly tag = "svg";

		constructor(public readonly text: string) {}

		toString() {
			return "Svg";
		}
	}

	const text = sOpenObject({
		kind: sOpenObject({
			text: sLiteral(true),
		}),
		text: sString(),
	});

	const textHandler = text.refine({
		class: Text,
		toIntermediate: (s) => ({ kind: { text: true }, text: "" }),
		fromIntermediate: (s) => new Text(s.text),
	});

	const svg = sIntersect([
		text,
		sOpenObject({
			kind: sOpenObject({
				svg: sLiteral(true),
			}),
		}),
	]);

	const svgHandler = svg.refine({
		class: Svg,
		toIntermediate: (s) => ({ kind: { text: true, svg: true }, text: "" }),
		fromIntermediate: (s) => new Svg(s.text),
	});

	const validTypes = sUnionMany([svgHandler, textHandler], {
		processingStrategy: "all",
	});
	const result = validTypes.deserialize({
		kind: {
			text: true,
			svg: true,
		},
		text: "test",
	});

	console.log(JSON.stringify(result, undefined, 4));
});
