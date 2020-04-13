import 'reflect-metadata';

export function debounce(f, ms) {
    let isCooldown = false;

    return function (...args) {
        if (isCooldown) {
            return;
        }

        f.apply(this, args);

        isCooldown = true;

        setTimeout(() => (isCooldown = false), ms);
    };
}

export default function Debounce(delay: number) {
    return (_, __, propertyDesciptor: PropertyDescriptor) => {
        propertyDesciptor.value = debounce(propertyDesciptor.value, delay);

        return propertyDesciptor;
    };
}
