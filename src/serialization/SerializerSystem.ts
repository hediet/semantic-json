import { NamespacedName, Namespace, namespace } from "../NamespacedNamed";
import { NamedSerializerImpl } from "./serializers";
import { Serializer } from "./Serializer";
import { SchemaDef, SchemaPackageDef } from "../schema/schemaDefs";

export class SerializerSystem<T = any> {
	private readonly knownSerializers = new Map<
		string,
		NamedSerializerImpl<T>
	>();

	public getSerializer(
		name: NamespacedName
	): NamedSerializerImpl<T> | undefined {
		const k = this.knownSerializers.get(name.toString());
		return k;
	}

	public getSerializerOrCreateUninitialized(
		name: NamespacedName
	): NamedSerializerImpl<T> {
		let k = this.knownSerializers.get(name.toString());
		if (!k) {
			k = new NamedSerializerImpl<T>(undefined, name);
			this.knownSerializers.set(name.toString(), k);
		}
		return k;
	}

	public isSerializerKnown(name: NamespacedName): boolean {
		return !!this.knownSerializers.get(name.toString());
	}

	public defineSerializer(
		name: NamespacedName,
		definition: Serializer<T>,
		schema?: SchemaDef
	) {
		// definition and schema must match!

		const namedSerializer = this.getSerializerOrCreateUninitialized(name);
		if (!schema) {
			// This adds all used serializers to this system.
			// Since "name" is lazily initialized, circles are handled.
			definition.toSchema(this);
		}
		namedSerializer.initializeUnderlyingSerializer(definition);
	}

	public getDefinedNamespaces(): Namespace[] {
		const namespaces = new Set<string>();
		for (const t of this.knownSerializers.values()) {
			namespaces.add(t.name.namespace);
		}
		return [...namespaces].map((ns) => namespace(ns));
	}

	public toPackage(ns: Namespace): SchemaPackageDef {
		const definitions: Record<string, SchemaDef> = {};
		for (const type of this.knownSerializers.values()) {
			if (type.name.namespace === ns.namespace) {
				definitions[
					type.name.name
				] = type.underlyingSerializer.toSchema(this);
			}
		}
		const result = new SchemaPackageDef(ns, definitions);
		return result;
	}

	public getDefinedPackages(): SchemaPackageDef[] {
		const result = new Array<SchemaPackageDef>();
		for (const ns of this.getDefinedNamespaces()) {
			result.push(this.toPackage(ns));
		}
		return result;
	}
}
