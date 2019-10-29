export abstract class BaseDeserializationResult<T> {}

export class OkDeserializationResult<T> extends BaseDeserializationResult<T> {
	constructor(public readonly value: T) {
		super();
	}

	public get isOk(): true {
		return true;
	}

	public unwrap(): T {
		return this.value;
	}
}

export class ErrorDeserializationResult extends BaseDeserializationResult<
	never
> {
	constructor(public readonly errors: DeserializationError[]) {
		super();
	}

	public unwrap(): never {
		throw new Error("Cannot unwrap error. This indicates a bug.");
	}

	public get isOk(): false {
		return false;
	}
}

export type DeserializationResult<T> =
	| OkDeserializationResult<T>
	| ErrorDeserializationResult;

export function deserializationValue<T>(value: T): OkDeserializationResult<T> {
	return new OkDeserializationResult(value);
}

export function deserializationError(
	...errors: (DeserializationError | { message: string })[]
): ErrorDeserializationResult {
	return new ErrorDeserializationResult(
		errors.map(e => {
			if (e instanceof DeserializationError) {
				return e;
			}
			return new DeserializationError({ message: e.message });
		})
	);
}

export class DeserializationError {
	public readonly message: string;
	public readonly path: (string | number)[];

	constructor(error: { message: string; path?: (string | number)[] }) {
		this.message = error.message;
		this.path = error.path === undefined ? [] : error.path;
	}

	public prependPath(path: string | number): DeserializationError {
		return new DeserializationError({
			message: this.message,
			path: [path].concat(...this.path),
		});
	}
}
