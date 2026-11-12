import camelCase from 'lodash/camelCase';
import capitalize from 'lodash/capitalize';
import kebabCase from 'lodash/kebabCase';
import snakeCase from 'lodash/snakeCase';
import startCase from 'lodash/startCase';
import truncate from 'lodash/truncate';
import upperFirst from 'lodash/upperFirst';

/** The string helpers the app uses, each doing one small real job */

/** truncate(text, { length }) cuts long text and adds an ellipsis, without breaking a word when `separator` is set */
export const shorten = (text, length = 60) => truncate(text, { length, separator: ' ', omission: '…' });

/** kebabCase("Engineering Manager") -> "engineering-manager": safe for file names and CSS classes */
export const slug = (text) => kebabCase(text);

/** camelCase("first name") -> "firstName": a property name made from a label */
export const propertyName = (label) => camelCase(label);

/** startCase("joinedAt") -> "Joined At": a readable label made from a property name */
export const labelFromKey = (key) => startCase(key);

/** capitalize lowers the rest ("mEI" -> "Mei"); upperFirst only touches the first letter */
export const properName = (name) => capitalize(name);
export const sentence = (text) => upperFirst(text);

export const csvFileName = (title) => `${snakeCase(title)}.csv`;
