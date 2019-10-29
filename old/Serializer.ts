/*export type TOtherDomain<
	TType extends Serializer<any, any>
> = TType extends Serializer<any, any, infer TOtherDomain> ? TOtherDomain : any;

export type TDomain<
	TType extends Serializer<any, any>
> = TType extends Serializer<any, any, any, infer TDomain> ? TDomain : any;
*/

export class ConversionError {
	public readonly message: string;
	public readonly path: (string | number)[];

	constructor(error: { message: string; path?: (string | number)[] }) {
		this.message = error.message;
		this.path = error.path === undefined ? [] : error.path;
	}

	public prependPath(path: string | number): ConversionError {
		return new ConversionError({
			message: this.message,
			path: [path].concat(...this.path),
		});
	}
}

export type ConversionResult<T> =
	| { kind: "error"; errors: ConversionError[] }
	| { kind: "successful"; result: T };

export class ErrorCollector {
	public readonly kind = "error";
	public readonly errors = new Array<ConversionError>();

	public get hasErrors(): boolean {
		return this.errors.length > 0;
	}

	public push(...error: ConversionError[]) {
		this.errors.push(...error);
	}
}

export function singleError(error: ConversionError): ConversionResult<any> {
	return {
		kind: "error",
		errors: [error],
	};
}

export abstract class Serializer<
	/** The type to serialize from and deserialize to */
	T,
	/** The type to serialize to and deserialize from */
	TOther
> {
	get T(): T {
		throw new Error("This method is not meant to be called at runtime.");
	}

	get TOther(): TOther {
		throw new Error("This method is not meant to be called at runtime.");
	}

	public abstract tryDeserialize(value: unknown): ConversionResult<T>;

	public abstract trySerialize(value: unknown): ConversionResult<TOther>;

	public isTypeOf(input: unknown): input is T {
		return this.trySerialize(input).kind === "successful";
	}

	public isOtherTypeOf(input: unknown): input is TOther {
		return this.tryDeserialize(input).kind === "successful";
	}

	/**
	 * @sealed
	 */
	public deserialize(value: unknown): T {
		const result = this.tryDeserialize(value);
		if (result.kind === "error") {
			throw new Error();
		}
		return result.result;
	}

	/**
	 * @sealed
	 */
	public serialize(value: unknown): TOther {
		const result = this.trySerialize(value);
		if (result.kind === "error") {
			throw new Error();
		}
		return result.result;
	}

	/**
	 * @sealed
	 */
	public deserializeTyped(value: TOther): T {
		return this.deserialize(value);
	}

	/**
	 * @sealed
	 */

	public serializeTyped(value: T): TOther {
		return this.serialize(value);
	}

	public or<T2, TOther2>(
		other: Serializer<T2, TOther2>
	): Serializer<T | T2, TOther | TOther2> {
		return null!;
	}

	/*public and<T2, TOther2, TIn2 extends TOther2, TOut2 extends TIn2>(
		other: Serializer<T2, TOther2, TIn2, TOut2>
	): Serializer<T & T2, TOther & TOther2, TIn & TIn2, TOut & TOut2> {
		return null!;
	}*/

	public refine<TNew>(refinement: Refinement<TNew, T, T, T>) {}
}

interface Refinement<T, TOther, TIn extends TOther, TOut extends TIn> {
	tryDeserialize(value: TOther): ConversionResult<T>;
	serialize(value: T): TOut;

	is?(input: TOther): input is TIn;
}
