import { Injectable } from '@angular/core';

@Injectable()
export class Framework {
  name: string;
  framework: any;
  widgets?: { [key: string]: any } = {};
  stylesheets?: string[] = [];
  scripts?: string[] = [];
};
