import 'reflect-metadata';

export default function Throttle(delay: number) {
    return (_, __, propertyDesciptor: PropertyDescriptor) => {

        propertyDesciptor.value = throttle(propertyDesciptor.value, delay);

        return propertyDesciptor;
    };
}

export function throttle(func, ms) {

    let isThrottled = false;
    let savedArgs = null;

    function wrapper() {

      if (isThrottled) {
        savedArgs = arguments;
        return;
      }

      func.apply(this, arguments);

      isThrottled = true;

      setTimeout(() => {
        isThrottled = false;
        if (savedArgs) {
          wrapper.apply(this, savedArgs);
          savedArgs = null;
        }
      }, ms);
    }

    return wrapper;
  }
