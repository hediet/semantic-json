import {
	Serializer,
	ConversionResult,
	singleError,
	ConversionError,
	ErrorCollector,
	TIn,
} from "./Serializer";

export class DowncastSerializer<T> extends Serializer<T, T> {
	public trySerialize(value: unknown): ConversionResult<T> {
		return { kind: "successful", result: value as T };
	}

	public tryDeserialize(value: unknown): ConversionResult<T> {
		return { kind: "successful", result: value as T };
	}
}

export class LiteralSerializer<T> extends Serializer<T, T> {
	constructor(public readonly value: T) {
		super();
	}

	public trySerialize(value: unknown): ConversionResult<T> {
		if (value !== this.value) {
			return singleError(
				new ConversionError({
					message: `Expected "${this.value}" but got "${value}".`,
				})
			);
		}

		return { kind: "successful", result: value as T };
	}

	public tryDeserialize(value: unknown): ConversionResult<T> {
		return this.trySerialize(value);
	}
}

export type TypeNames = {
	boolean: boolean;
	number: number;
	string: string;
};

export class TypeSerializer<
	TTypeName extends keyof TypeNames
> extends Serializer<TypeNames[TTypeName], TypeNames[TTypeName]> {
	constructor(private readonly typeName: TTypeName) {
		super();
	}

	public trySerialize(
		value: unknown
	): ConversionResult<TypeNames[TTypeName]> {
		if (typeof value !== this.typeName) {
			return singleError(
				new ConversionError({
					message: `Expected a ${
						this.typeName
					} but got a ${typeof value}.`,
				})
			);
		}

		return { kind: "successful", result: value as TypeNames[TTypeName] };
	}

	public tryDeserialize(
		value: unknown
	): ConversionResult<TypeNames[TTypeName]> {
		return this.trySerialize(value);
	}
}

// TDomain T -> TOther
// TDomain[] | object | string | boolean | number
// TDomain (T[]) -> TOther[]

type Test<T> = T extends (infer I)[] ? I : never;

const i: Test<number[]>;

export class ArraySerializer<T, TOther> extends Serializer<T[], TOther[]> {
	constructor(public readonly itemSerializer: Serializer<T, TOther>) {
		super();
	}

	public trySerialize(value: unknown): ConversionResult<TOther[]> {
		if (!(value instanceof Array)) {
			return singleError(
				new ConversionError({
					message: `Expected an array but got a ${typeof value}.`,
				})
			);
		}
		const errors = new ErrorCollector();
		const result = new Array<TOther>(value.length);
		for (let i = 0; i < value.length; i++) {
			const r = this.itemSerializer.trySerialize(value[i]);
			if (r.kind === "error") {
				errors.push(...r.errors.map(e => e.prependPath(i)));
			} else {
				result[i] = r.result;
			}
		}

		if (errors.hasErrors) {
			return errors;
		}

		return { kind: "successful", result };
	}

	public tryDeserialize(value: unknown): ConversionResult<T[]> {}
}

export class UnionSerializer<
	TFrom,
	T1 extends Serializer<any, TFrom>,
	T2 extends Serializer<any, TFrom>
> extends Serializer<
	T1["T"] | T2["T"],
	T1[""],
	TIn<T1> | TIn<T2>,
	(T1["TOut"] | T2["TOut"]) & (TIn<T1> | TIn<T2>)
> {
	constructor(
		public readonly s1: Serializer<any, TFrom>,
		public readonly s2: Serializer<any, TFrom>
	) {
		super();
	}

	public tryDeserialize(value: TFrom): ConversionResult<T1["T"] | T2["T"]> {}

	public serialize(
		value: T1["T"] | T2["T"]
	): (T1["TOut"] | T2["TOut"]) & (TIn<T1> | TIn<T2>) {}
}
