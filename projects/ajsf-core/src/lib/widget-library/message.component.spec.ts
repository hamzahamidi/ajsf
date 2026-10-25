import { JsonSchemaFormService } from '../json-schema-form.service';
import { MessageComponent } from './message.component';

describe('MessageComponent', () => {
  it('updates interpolated messages without changing form data', () => {
    const jsf = new JsonSchemaFormService();
    jsf.data = { firstname: 'Ada', lastname: 'Lovelace' };
    const component = new MessageComponent(jsf);
    component.layoutNode = {
      options: { message: '<strong>{{values.firstname}} {{values.lastname}}</strong>' },
    };
    component.dataIndex = [];

    component.ngOnInit();

    expect(component.message).toBe('<strong>Ada Lovelace</strong>');

    jsf.data = { firstname: 'Grace', lastname: 'Hopper' };
    jsf.dataChanges.next(jsf.data);

    expect(component.message).toBe('<strong>Grace Hopper</strong>');
    expect(jsf.data).toEqual({ firstname: 'Grace', lastname: 'Hopper' });

    component.ngOnDestroy();
    jsf.data = { firstname: 'Dorothy', lastname: 'Vaughan' };
    jsf.dataChanges.next(jsf.data);

    expect(component.message).toBe('<strong>Grace Hopper</strong>');
  });

  it('keeps static messages unchanged', () => {
    const jsf = new JsonSchemaFormService();
    const component = new MessageComponent(jsf);
    component.layoutNode = { options: { message: '<p>Static</p>' } };
    component.dataIndex = [];

    component.ngOnInit();

    expect(component.message).toBe('<p>Static</p>');
    component.ngOnDestroy();
  });
});
