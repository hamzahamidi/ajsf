import { Component, ChangeDetectionStrategy, Input, NgModule } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Framework } from './framework-library/framework';
import { FrameworkLibraryService } from './framework-library/framework-library.service';
import { JsonSchemaFormModule } from './json-schema-form.module';
import { WidgetLibraryService } from './widget-library/widget-library.service';

@Component({
  selector: 'marker-framework',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<span class="marker-framework"></span>`,
})
class MarkerFrameworkComponent {
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];
}

@NgModule({
  imports: [JsonSchemaFormModule],
  providers: [
    FrameworkLibraryService,
    WidgetLibraryService,
    {
      provide: Framework,
      useValue: { name: 'marker', framework: MarkerFrameworkComponent },
      multi: true,
    },
  ],
})
class MarkerFrameworkModule {}

@Component({
  standalone: true,
  imports: [JsonSchemaFormModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<json-schema-form [schema]="schema" [framework]="framework"></json-schema-form>`,
})
class CoreOnlyHost {
  schema = { type: 'object', properties: { name: { type: 'string' } } };
  framework = 'no-framework';
}

// Listing the host in the testing module's imports would hoist its providers to root.
describe('JsonSchemaFormModule in a standalone component', () => {
  it('renders when it is the only AJSF import', () => {
    TestBed.configureTestingModule({});
    const fixture = TestBed.createComponent(CoreOnlyHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[type=text]'),
      'the no-framework form should render its text input').toBeTruthy();
  });

  it('keeps using a framework provided by a parent injector', () => {
    TestBed.configureTestingModule({ imports: [MarkerFrameworkModule] });
    const fixture = TestBed.createComponent(CoreOnlyHost);
    fixture.componentInstance.framework = 'marker';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.marker-framework'),
      'the framework registered above the component should still apply').toBeTruthy();
  });
});
