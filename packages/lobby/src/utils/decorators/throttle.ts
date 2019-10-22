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
  let savedThis = null;

  function wrapper() {

    if (isThrottled) {
      savedArgs = arguments;
      savedThis = this;
      return;
    }

    func.apply(this, arguments);

    isThrottled = true;

    setTimeout(() => {
      isThrottled = false;
      if (savedArgs) {
        wrapper.apply(savedThis, savedArgs);
        savedArgs = savedThis = null;
      }
    }, ms);
  }

  return wrapper;
}
