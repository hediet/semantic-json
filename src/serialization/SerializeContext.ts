import { Namespace } from "../NamespacedNamed";

export class SerializeContext {
	constructor(public readonly prefixesEnabled = false) {}

	private curKey = 1;
	private readonly namespaces = new Map<string, string>();

	public getPrefixForNamespace(ns: Namespace): string {
		if (!this.prefixesEnabled) {
			throw new Error("Not in object context!");
		}

		let prefix = this.namespaces.get(ns.namespace);
		if (!prefix) {
			prefix = `p${this.curKey++}`;
			this.namespaces.set(ns.namespace, prefix);
		}
		return prefix;
	}

	public getDefinedPrefixes(): { prefix: string; namespace: string }[] {
		return [...this.namespaces].map(([namespace, prefix]) => ({
			prefix,
			namespace,
		}));
	}
}
