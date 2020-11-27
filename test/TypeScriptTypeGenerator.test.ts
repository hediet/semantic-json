import {
	TypeScriptTypeGenerator,
	Serializer,
	sLazy,
	sOpenObject,
	sArrayOf,
	sString,
	optionalProp,
	sUnion,
	sLiteral,
	sBoolean,
	prop,
	sTypePackage,
} from "../src";
import { namespace } from "../src/NamespacedNamed";
import { deepEqual, deepStrictEqual } from "assert";

describe("TypeScriptTypeGenerator", () => {
	it("test", () => {
		const g = new TypeScriptTypeGenerator();
		const t = g.getType(sTypePackage);
		debugger;
	});

	it("works", () => {
		const g = new TypeScriptTypeGenerator();

		const sTreeNode: Serializer<any> = sLazy(() =>
			sOpenObject({
				children: sArrayOf(sTreeNode),
				items: sArrayOf(
					sOpenObject({
						text: prop(sString(), { description: "The text" }),
						emphasis: optionalProp(
							sUnion([
								sLiteral("style1"),
								sLiteral("style2"),
								sLiteral("style3"),
								sString(),
							]),
							{}
						),
					})
				),
				segment: optionalProp(sString(), {}),
				isMarked: optionalProp(sBoolean(), {}),
			}).defineAs(namespace("hediet.de/visualization")("node"))
		);

		const sTree = sOpenObject({
			kind: sOpenObject({
				tree: sLiteral(true),
			}),
			root: sTreeNode,
		});

		function normalizeString(str: string): string {
			return str
				.split("\n")
				.map((str) => str.trim())
				.join("\n")
				.trim();
		}

		deepStrictEqual(
			normalizeString(g.getType(sTree)),
			normalizeString(`
                {
                    kind: {
                        tree: true;
                    };
                    root: Node;
                }
            `)
		);
		deepStrictEqual(
			normalizeString(g.getDefinitionSource()),
			normalizeString(`
                type Node = {
                    children: (Node)[];
                    items: ({
                        /**
                         * The text
                         */
                        text: string;
                        emphasis?: "style1" | "style2" | "style3" | string;
                    })[];
                    segment?: string;
                    isMarked?: boolean;
                };
            `)
		);
	});
});
