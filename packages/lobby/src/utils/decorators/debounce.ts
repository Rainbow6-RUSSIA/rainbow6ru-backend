import 'reflect-metadata';

export default function Debounce(delay: number) {
    return (_, __, propertyDesciptor: PropertyDescriptor) => {

        propertyDesciptor.value = debounce(propertyDesciptor.value, delay);

        return propertyDesciptor;
    };
}

export function debounce(f, ms) {

    let isCooldown = false;

    return function() {
      if (isCooldown) { return; }

      f.apply(this, arguments);

      isCooldown = true;

      setTimeout(() => isCooldown = false, ms);
    };

  }
