import 'reflect-metadata';

export default function ReverseThrottle(delay: number) {
    return (_, __, propertyDesciptor: PropertyDescriptor) => {

        propertyDesciptor.value = reverseThrottle(propertyDesciptor.value, delay);

        return propertyDesciptor;
    };
}

export function reverseThrottle(func, ms) {

    let isThrottled = false;
    let savedArgs = null;
    let savedThis = null;

    function wrapper() {

      savedArgs = arguments;
      savedThis = this;

      if (isThrottled) { return; }

      isThrottled = true;

      setTimeout(() => {
        isThrottled = false;
        func.apply(savedThis, savedArgs);
        savedArgs = savedThis = null;
      }, ms);
    }

    return wrapper;
  }
