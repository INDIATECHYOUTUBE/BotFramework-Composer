// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/** @jsx jsx */
import { jsx } from '@emotion/core';
import { useState, useContext, useEffect, Fragment } from 'react';
import { RouteComponentProps } from '@reach/router';
import formatMessage from 'format-message';
import { Dialog, DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { TextField } from 'office-ui-fabric-react/lib/TextField';

import settingsStorage from '../../utils/dialogSettingStorage';
import { projectContainer } from '../design/styles';
import { StoreContext } from '../../store';

import { ToolBar } from './../../components/ToolBar/index';
import {
  ContentHeaderStyle,
  HeaderText,
  ContentStyle,
  contentEditor,
  targetListTiTle,
  targetListItemSelected,
  targetListItemNotSelected,
} from './styles';
import { CreatePublishTarget } from './createPublishTarget';
import { PublishStatusList } from './publishStatusList';

const Publish: React.FC<RouteComponentProps> = () => {
  const { state, actions } = useContext(StoreContext);
  const { settings, botName, publishTypes, projectId, publishHistory } = state;
  const [addDialogHidden, setAddDialogHidden] = useState(true);
  const [publishDialogHidden, setPublishDialogHidden] = useState(true);
  const [selectedTarget, setSelectedTarget] = useState();
  const [dialogProps, setDialogProps] = useState({
    title: 'Title',
    type: DialogType.normal,
    children: {},
  });
  const toolbarItems = [
    {
      type: 'action',
      text: formatMessage('Add new profile'),
      buttonProps: {
        iconProps: {
          iconName: 'Add',
        },
        onClick: () => addPublishTarget(),
      },
      align: 'left',
      dataTestid: 'publishPage-ToolBar-Add',
      disabled: false,
    },
    {
      type: 'action',
      text: formatMessage('Publish to selected target'),
      buttonProps: {
        iconProps: {
          iconName: 'CloudUpload',
        },
        onClick: () => selectPublishTarget(),
      },
      align: 'left',
      dataTestid: 'publishPage-ToolBar-Publish',
      disabled: false,
    },
  ];

  useEffect(() => {
    // load up the list of all publish targets
    actions.getPublishTargetTypes();
  }, []);

  useEffect(() => {
    // get selected target publish history
    if (selectedTarget) {
      actions.getPublishHistory(projectId, selectedTarget);
    }
  }, [selectedTarget]);

  useEffect(() => {
    setDialogProps({
      title: 'Add a publish target',
      type: DialogType.normal,
      children: (
        <CreatePublishTarget
          targetTypes={publishTypes.map(type => {
            return { key: type, text: type };
          })}
          onSave={savePublishTarget}
          onCancel={closeAddDialog}
        />
      ),
    });
  }, [publishTypes]);

  const addPublishTarget = () => {
    setAddDialogHidden(false);
  };

  const selectPublishTarget = () => {
    setPublishDialogHidden(false);
  };

  const closeAddDialog = () => {
    setAddDialogHidden(true);
  };

  const closePublishDialog = () => {
    setPublishDialogHidden(true);
  };
  const savePublishTarget = (name, type, configuration) => {
    console.log(`save ${name} ${type} ${configuration}`);

    actions.setSettings(
      projectId,
      botName,
      {
        ...settings,
        publishTargets: [
          {
            name,
            type,
            configuration,
          },
        ].concat(settings.publishTargets),
      },
      undefined
    );
  };

  const publish = async comment => {
    // publish to remote
    if (selectPublishTarget) {
      const sensitiveSettings = settingsStorage.get(botName);
      await actions.publishToTarget(projectId, { ...selectPublishTarget, sensitiveSettings });
    }
  };

  return (
    <div>
      <Dialog hidden={addDialogHidden} onDismiss={closeAddDialog} dialogContentProps={dialogProps}>
        {dialogProps.children}
      </Dialog>
      <PublishDialog
        hidden={publishDialogHidden}
        onDismiss={closePublishDialog}
        onSubmit={publish}
        target={selectedTarget}
      />
      <ToolBar toolbarItems={toolbarItems} />
      <div css={ContentHeaderStyle}>
        <h1 css={HeaderText}>{formatMessage('Publish Profiles')}</h1>
      </div>
      <div css={ContentStyle} data-testid="Publish">
        <div css={projectContainer}>
          {!settings.publishTargets || settings.publishTargets.length < 1 ? (
            <div>This bot does not have a profile to publish yet</div>
          ) : (
            <Fragment>
              <div css={targetListTiTle}>All profiles</div>
              <TargetList list={settings.publishTargets} onSelect={setSelectedTarget} selectedTarget={selectedTarget} />
            </Fragment>
          )}
        </div>
        <div css={contentEditor}>
          {selectedTarget ? (
            <Fragment>
              <div>{selectedTarget.name}</div>
              <div>{publishTypes.find(item => item === selectedTarget.type)}</div>
              {publishHistory.length > 0 ? (
                <PublishStatusList items={publishHistory} onItemClick={item => console.log(item)} />
              ) : (
                <div>No publish History</div>
              )}
            </Fragment>
          ) : null}
        </div>
      </div>
    </div>
  );
};
export default Publish;

const TargetList = props => {
  return props.list.map(target => {
    return (
      <DefaultButton
        key={target.name}
        onClick={() => props.onSelect(target)}
        styles={
          props.selectedTarget && props.selectedTarget.name === target.name
            ? targetListItemSelected
            : targetListItemNotSelected
        }
        text={target.name}
        ariaLabel={formatMessage('Publish Target')}
        ariaHidden={false}
      />
    );
  });
};
const PublishDialog = props => {
  const [comment, setComment] = useState('');
  const publishDialogProps = {
    title: 'Publish',
    type: DialogType.normal,
    subText: 'You are about to publish your bot to the target below. Do you want to proceed?',
  };
  const submit = async () => {
    await props.onSubmit(comment);
    props.onDismiss();
  };
  return props.target ? (
    <Dialog hidden={props.hidden} onDismiss={props.onDismiss} dialogContentProps={publishDialogProps}>
      <Fragment>
        <div>{props.target.name}</div>
        <form onSubmit={submit}>
          <TextField
            placeholder="Provide a bried description of this publish. It will appear on the publish history list"
            label={formatMessage('Comment')}
            // styles={styles.textarea}
            onChange={(e, newvalue) => setComment(newvalue || '')}
            multiline={true}
          />
        </form>
        <DialogFooter>
          <DefaultButton onClick={props.onDismiss} text={formatMessage('Cancel')} />
          <PrimaryButton onClick={submit} text={formatMessage('Save')} />
        </DialogFooter>
      </Fragment>
    </Dialog>
  ) : null;
};
