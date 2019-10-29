export type ConvTpT<TConvTp extends ConvTp> = TConvTp extends ConvTp<
	infer T,
	any
>
	? T
	: never;

export type ConvTpTIn<TConvTp extends ConvTp> = TConvTp extends ConvTp<
	any,
	infer TIn,
	any
>
	? TIn
	: never;

export interface ConvTp<T = any, TIn extends T = T, TOut extends TIn = TIn> {
	T(t: T): void;
	TIn(t: TIn): void;
	TOut: TOut;
}
export interface SimpleTp<T> extends ConvTp<unknown, T, T> {}

export abstract class Converter<
	TSource extends ConvTp,
	TTarget extends ConvTp
> {
	public get TSource(): {
		T: ConvTpT<TSource>;
		TIn: ConvTpTIn<TSource>;
		TOut: TSource["TOut"];
	} {
		throw "";
	}

	public get TTarget(): {
		T: ConvTpT<TTarget>;
		TIn: ConvTpTIn<TTarget>;
		TOut: TTarget["TOut"];
	} {
		throw "";
	}

	public abstract tryToTarget(
		value: ConvTpT<TSource>
	): ConversionResult<TTarget["TOut"]>;

	public isSource(
		x: ConvTpT<TSource>
	): x is ConvTpTIn<TSource> & ConvTpT<TSource> {
		return this.tryToTarget(x).kind === "successful";
	}

	public abstract tryToSource(
		value: ConvTpT<TTarget>
	): ConversionResult<TSource["TOut"]>;

	public isTarget(
		x: ConvTpT<TTarget>
	): x is ConvTpTIn<TTarget> & ConvTpT<TTarget> {
		return this.tryToSource(x).kind === "successful";
	}
}

/*const c1: Converter<SimpleTp<string>, SimpleTp<number>> = null!;
c1.
const c2: Converter<ConvTp<string, string>, ConvTp<string, string>> = c1;*/
