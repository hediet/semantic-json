import {
	sUnion,
	sString,
	sNumber,
	sObject,
	sLiteral,
	sUnionMany,
	sIntersect,
} from "../src";

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

	const text = sObject(
		{
			kind: sObject(
				{
					text: sLiteral(true),
				},
				{
					allowUnknownProperties: true,
				}
			),
			text: sString(),
		},
		{
			allowUnknownProperties: true,
		}
	);

	const textHandler = text.refine({
		class: Text,
		toIntermediate: (s) => ({ kind: { text: true }, text: "" }),
		fromIntermediate: (s) => new Text(s.text),
	});

	const svg = sIntersect([
		text,
		sObject(
			{
				kind: sObject(
					{
						svg: sLiteral(true),
					},
					{
						allowUnknownProperties: true,
					}
				),
			},
			{
				allowUnknownProperties: true,
			}
		),
	]);

	const svgHandler = svg.refine({
		class: Svg,
		toIntermediate: (s) => ({ kind: { text: true, svg: true }, text: "" }),
		fromIntermediate: (s) => new Svg(s.text),
	});

	const validTypes = sUnionMany([svgHandler, textHandler], { eager: false });
	const result = validTypes.deserialize({
		kind: {
			text: true,
			svg: true,
		},
		text: "test",
	});

	console.log(JSON.stringify(result, undefined, 4));
});
