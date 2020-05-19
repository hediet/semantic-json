import { Namespace } from "../NamespacedNamed";

export class SerializeContext {
	public prefixesEnabled = false;

	private key = 1;
	private readonly namespaces = new Map<string, string>();

	public getPrefixForNamespace(ns: Namespace): string {
		if (!this.prefixesEnabled) {
			throw new Error("Not in object context!");
		}

		let prefix = this.namespaces.get(ns.namespace);
		if (!prefix) {
			prefix = `p${this.key++}`;
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
