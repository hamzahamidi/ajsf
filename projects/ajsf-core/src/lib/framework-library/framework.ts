import { Injectable } from '@angular/core';

@Injectable()
export abstract class Framework {
  abstract name: string;
  abstract framework: any;
  widgets?: { [key: string]: any } ;
  abstract stylesheets?: string[] ;
  abstract scripts?: string[] ;
}
