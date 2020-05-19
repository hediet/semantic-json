import { NamespacedName, Namespace, namespace } from "../NamespacedNamed";
import { NamedSerializerImpl } from "./serializers";
import { Serializer, SerializerOfKind, NamedSerializer } from "./Serializer";
import { AnnotatedJSON } from "../schema/schemaDefs";

export class SerializerSystem {
	private readonly knownSerializers = new Map<
		string,
		NamedSerializerImpl<AnnotatedJSON>
	>();

	public getSerializer(
		name: NamespacedName
	): NamedSerializerImpl<AnnotatedJSON> | undefined {
		const k = this.knownSerializers.get(name.toString());
		return k;
	}

	public getOrInitializeEmptySerializer(
		name: NamespacedName
	): NamedSerializerImpl<AnnotatedJSON> {
		let k = this.knownSerializers.get(name.toString());
		if (!k) {
			k = new NamedSerializerImpl<AnnotatedJSON>(undefined, name, true);
			this.knownSerializers.set(name.toString(), k);
		}
		return k;
	}

	public isSerializeKnown(name: NamespacedName): boolean {
		return !!this.knownSerializers.get(name.toString());
	}

	public defineSerializer(
		name: NamespacedName,
		definition: Serializer<AnnotatedJSON>
	) {
		this.getOrInitializeEmptySerializer(
			name
		).initializeUnderlyingSerializer(definition);
	}

	public getDefinedNamespaces(): Namespace[] {
		const namespaces = new Set<string>();
		for (const t of this.knownSerializers.values()) {
			namespaces.add(t.name.namespace);
		}
		return [...namespaces].map((ns) => namespace(ns));
	}

	/*
	public toPackage(ns: Namespace): TypePackageDef {
		const definitions: Record<string, TypeDef> = {};
		for (const type of this.knownSerializers.values()) {
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
	}*/
}
