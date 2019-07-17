import { MediaMarshaller } from '@angular/flex-layout/core';

export function fixAngularFlex() {
  // monkey patch based on errors in console  - https://github.com/angular/flex-layout/issues/1011
  const MediaMarshallerUpdateElement = MediaMarshaller.prototype.updateElement;

  MediaMarshaller.prototype.updateElement = function (element: HTMLElement, key: string, value: any) {
    if (key === 'layout-gap' && (value === null || value === undefined)) {
      value = '0px';
    }
    MediaMarshallerUpdateElement.apply(this, [element, key, value]);
  };
}
