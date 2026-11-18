/** 02. Object types, union types, literal types, type aliases and narrowing. */

// A type alias gives a name to any type
export type Id = string | number; // a union: one or the other

// Literal types: the value itself is the type, so only these four strings are allowed
export type Status = 'idle' | 'loading' | 'done' | 'failed';

// An object type; `email?` is optional, so it may be missing (type `string | undefined`)
export type User = {
  id: Id;
  name: string;
  email?: string;
};

// Narrowing: inside each branch TypeScript knows which member of the union you have
export function describeId(id: Id): string {
  if (typeof id === 'number') return `#${id}`; // here id is a number
  return id.toUpperCase(); // here id is a string
}

export function contactLine(user: User): string {
  return user.email ? `${user.name} <${user.email}>` : user.name; // email is `string` only after the check
}

export function statusLabel(status: Status): string {
  switch (status) {
    case 'idle':
      return 'Not started';
    case 'loading':
      return 'Loading...';
    case 'done':
      return 'Finished';
    case 'failed':
      return 'Something went wrong';
  }
}

// A discriminated union: the `kind` literal tells the members apart
export type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rect'; width: number; height: number };

export function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rect':
      return shape.width * shape.height;
  }
}
