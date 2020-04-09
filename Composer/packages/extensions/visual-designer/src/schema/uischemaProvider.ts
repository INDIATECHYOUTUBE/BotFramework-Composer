// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import get from 'lodash/get';

import { VisualWidget, VisualSchema } from './visualSchema.types';

export class UISchemaProvider {
  schema: VisualSchema;

  constructor(uiSchema: VisualSchema) {
    this.schema = uiSchema;
  }

  get = ($kind: string): VisualWidget => {
    return get(this.schema, $kind, this.schema.default);
  };
}
