import { Inject, Injectable } from '@angular/core';
import { Framework } from '@zajsf/core';
import { CssFrameworkComponent } from './css-framework.component';
import { CSS_FRAMEWORK_CFG, css_fw } from './css-framework.defs';
import { CssframeworkService } from './css-framework.service';



@Injectable()
export class CssFramework extends Framework {
  name = 'css';

  framework:any = CssFrameworkComponent;
  config:css_fw.frameworkcfg
  constructor(@Inject(CSS_FRAMEWORK_CFG ) cfg:css_fw.frameworkcfg,public cssFWService:CssframeworkService){
        super();
        
        this.name=cfg.name;
        this.text=cfg.text||this.name;
        this.stylesheets=cfg.stylesheets;
        this.scripts=cfg.scripts;
        this.config=cfg;
        this.widgets=cfg.widgets;
  }
  getActiveTheme():css_fw.themeKV{
    let activeRequestedThemeName=this.cssFWService.getActiveRequestedTheme();
    let frameWorkThemes=this.config?.widgetstyles?.__themes__;
    
    let theme=frameWorkThemes && frameWorkThemes[0]
    if(activeRequestedThemeName){//if not set return first theme in config;
      theme={name:activeRequestedThemeName,text:activeRequestedThemeName};
      if(frameWorkThemes){
        let filtered=frameWorkThemes.filter(theme=>{return theme.name==activeRequestedThemeName});
        theme=(filtered && filtered[0])||theme;
      }
    }
    return  theme;
  }

  requestThemeChange(name:string){
    this.cssFWService.requestThemeChange(name);
  }

  registerTheme(newTheme:css_fw.themeKV,overwrite:boolean=true):boolean{
    let themeList=this.config?.widgetstyles?.__themes__||[];
    let matchedThemes=themeList.filter(theme=>{return newTheme.name==theme.name});
    if(matchedThemes && matchedThemes[0]){
      if(overwrite){
        matchedThemes[0].text=newTheme.text;
        return true;
      }
      if(!overwrite){
        return false;
      }
      
    }
    if(!matchedThemes || matchedThemes.length==0){
      let cfg:any=this.config
      cfg.widgetstyles= this.config.widgetstyles||{};
      cfg.widgetstyles.__themes__=cfg.widgetstyles.__themes__||[];
      cfg.widgetstyles.__themes__.push(newTheme);
      return true;
    }
  };

  unregisterTheme(name:string):boolean{
    let themeList=this.config?.widgetstyles?.__themes__;
    let foundInd=-1;
    if(themeList){
        themeList.forEach((theme,ind)=>{
          if(name==theme.name){
            foundInd=ind;
          }
      });
      if(foundInd>=0){
        themeList.splice(foundInd,1);
        return true;
      }
    }
    return false;
  }

  getConfig():css_fw.frameworkcfg{
    return this.config;
  }

  /*
  stylesheets = [
    //TODO-enable for dev only
    cdn.tailwindcss.com/3.3.3'
  ];


  scripts = [

  ];
  */

}
