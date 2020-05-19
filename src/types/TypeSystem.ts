import { NamespacedName, Namespace, namespace } from "../NamespacedNamed";
import { TypePackageDef, TypeDef } from "../schema/typeDefs";
import { Type } from "./types";
import { TypeDefinition } from "./TypeDefinition";

export class TypeSystem {
	private readonly knownTypes = new Map<string, TypeDefinition>();

	public getType(name: NamespacedName): TypeDefinition | undefined {
		const k = this.knownTypes.get(name.toString());
		return k;
	}

	public getOrCreateType(name: NamespacedName): TypeDefinition {
		let k = this.knownTypes.get(name.toString());
		if (!k) {
			k = new TypeDefinition(name, undefined);
			this.knownTypes.set(name.toString(), k);
		}
		return k;
	}

	public isTypeKnown(name: NamespacedName): boolean {
		return !!this.knownTypes.get(name.toString());
	}

	public defineType(name: NamespacedName, definition: Type) {
		this.getOrCreateType(name).updateDefinition(definition);
	}

	public getDefinedNamespaces(): Namespace[] {
		const namespaces = new Set<string>();
		for (const t of this.knownTypes.values()) {
			namespaces.add(t.namespacedName.namespace);
		}
		return [...namespaces].map((ns) => namespace(ns));
	}

	public toPackage(ns: Namespace): TypePackageDef {
		const definitions: Record<string, TypeDef> = {};
		for (const type of this.knownTypes.values()) {
			if (type.namespacedName.namespace === ns.namespace) {
				definitions[
					type.namespacedName.name
				] = type.definition.toTypeDef();
			}
		}
		const result = new TypePackageDef(ns, definitions);
		return result;
	}

	public getDefinedPackages(): TypePackageDef[] {
		const result = new Array<TypePackageDef>();
		for (const ns of this.getDefinedNamespaces()) {
			result.push(this.toPackage(ns));
		}
		return result;
	}
}
