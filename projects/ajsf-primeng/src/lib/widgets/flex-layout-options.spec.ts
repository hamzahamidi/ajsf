import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PrimengFrameworkModule } from '../primeng-framework.module';
import { PrimengFlexLayoutRootComponent } from './primeng-flex-layout-root.component';

describe('flex layout options (primeng)', () => {
  let fixture: ComponentFixture<PrimengFlexLayoutRootComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PrimengFrameworkModule, NoopAnimationsModule],
    }).compileComponents();
  }));

  function itemFor(options: any): HTMLElement {
    fixture = TestBed.createComponent(PrimengFlexLayoutRootComponent);
    fixture.componentInstance.layout = [{ name: 'x', type: 'text', options }];
    fixture.componentInstance.layoutIndex = [];
    fixture.componentInstance.dataIndex = [];
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('div');
  }

  it('renders an item wrapper for a layout node', () => {
    expect(itemFor({})).toBeTruthy();
  });

  it('applies fxFlex as flex-basis', () => {
    expect(itemFor({ fxFlex: '50%' }).style.flexBasis).toEqual('50%');
  });

  it('caps a percentage fxFlex with max-width, as the directive did', () => {
    expect(itemFor({ fxFlex: '50%' }).style.maxWidth).toEqual('50%');
  });

  it('does not cap a non-percentage fxFlex', () => {
    const item = itemFor({ fxFlex: '200px' });
    expect(item.style.flexBasis).toEqual('200px');
    expect(item.style.maxWidth).toEqual('');
  });

  it('applies fxFlexOrder as order', () => {
    expect(itemFor({ fxFlexOrder: '2' }).style.order).toEqual('2');
  });

  it('applies fxFlexOffset as margin-left', () => {
    expect(itemFor({ fxFlexOffset: '10px' }).style.marginLeft).toEqual('10px');
  });

  it('maps fxFlexAlign onto align-self', () => {
    expect(itemFor({ fxFlexAlign: 'start' }).style.alignSelf).toEqual('flex-start');
    expect(itemFor({ fxFlexAlign: 'end' }).style.alignSelf).toEqual('flex-end');
  });

  it('lets an explicit align-self win over fxFlexAlign', () => {
    expect(itemFor({ fxFlexAlign: 'start', 'align-self': 'center' }).style.alignSelf)
      .toEqual('center');
  });

  it('falls back to the flex-basis option when fxFlex is absent', () => {
    expect(itemFor({ 'flex-basis': '30%' }).style.flexBasis).toEqual('30%');
  });

  it('ignores an unknown fxFlexAlign rather than emitting it raw', () => {
    expect(itemFor({ fxFlexAlign: 'nonsense' }).style.alignSelf).toEqual('');
  });
});
