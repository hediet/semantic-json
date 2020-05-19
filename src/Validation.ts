export abstract class BaseValidation<T> {}

export class ValidData<T> extends BaseValidation<T> {
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

export class InvalidData extends BaseValidation<never> {
	constructor(public readonly errors: ValidationError[]) {
		super();
	}

	public formatError(): string {
		return this.errors.map((e) => e.message).join("\n");
	}

	public unwrap(): never {
		throw new Error(
			`Could not deserialize input. ${this.errors.map((e) => e.message)}`
		);
	}

	public get isOk(): false {
		return false;
	}
}

export type Validation<T> = ValidData<T> | InvalidData;

export function validData<T>(value: T): ValidData<T> {
	return new ValidData(value);
}

export function invalidData(
	...errors: (ValidationError | { message: string })[]
): InvalidData {
	return new InvalidData(
		errors.map((e) => {
			if (e instanceof ValidationError) {
				return e;
			}
			return new ValidationError({ message: e.message });
		})
	);
}

export interface ValidationErrorAlternative {
	alternativeId: string;
	errors: ValidationError[];
}

export class ValidationError {
	public readonly message: string;
	public readonly path: (string | number)[];
	public readonly errorAlternatives: ValidationErrorAlternative[];

	constructor(error: {
		message: string;
		path?: (string | number)[];
		errorAlternatives?: ValidationErrorAlternative[];
	}) {
		this.message = error.message;
		this.path = error.path === undefined ? [] : error.path;
		this.errorAlternatives = error.errorAlternatives || [];
	}

	public prependPath(path: string | number): ValidationError {
		return new ValidationError({
			message: this.message,
			path: [path].concat(...this.path),
		});
	}
}
