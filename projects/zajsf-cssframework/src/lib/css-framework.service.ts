import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CssframeworkService {

  frameworkTheme$: Observable<string>;
  activeRequestedTheme:string;
  frameworkThemeSubject: Subject<string>;
  constructor() {
    this.frameworkThemeSubject = new Subject<string>();
    this.frameworkTheme$ = this.frameworkThemeSubject.asObservable();
   }

   //TODO-review: this acts as a public api to change the theme
   //but doesn't do the actual change, instead it relies on 
   //the CssFramewkCoromponent having subscribed to listen 
   //and perform the actual theme change
   requestThemeChange(themeName:string){
      this.frameworkThemeSubject.next(themeName);
      this.activeRequestedTheme=themeName;
   }

   //TODO-review:there's no way of knowing what the individual component instance
   //has set its theme to, this is just the theme made through the requestThemeChange
   //calls and not guaranteed to correspond to the actual theme set by the 
   //component instance themselves
   getActiveRequestedTheme():string{
      return this.activeRequestedTheme;
   }
}
