import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import type { SystemStyleObject } from '@invoke-ai/ui-library';
import { Button, Flex, Spacer } from '@invoke-ai/ui-library';
import { useStore } from '@nanostores/react';
import { useAppSelector } from 'app/store/storeHooks';
import { IAINoContentFallback } from 'common/components/IAIImageFallback';
import ScrollableContent from 'common/components/OverlayScrollbars/ScrollableContent';
import { firefoxDndFix } from 'features/dnd/util';
import { RootContainerElementEditMode } from 'features/nodes/components/sidePanel/builder/ContainerElement';
import { buildFormElementDndData, useBuilderDndMonitor } from 'features/nodes/components/sidePanel/builder/dnd-hooks';
import { WorkflowBuilderEditMenu } from 'features/nodes/components/sidePanel/builder/WorkflowBuilderMenu';
import { $hasTemplates } from 'features/nodes/store/nodesSlice';
import { selectIsFormEmpty } from 'features/nodes/store/selectors';
import type { FormElement } from 'features/nodes/types/workflow';
import { buildContainer, buildDivider, buildHeading, buildText } from 'features/nodes/types/workflow';
import type { PropsWithChildren, RefObject } from 'react';
import { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetOpenAPISchemaQuery } from 'services/api/endpoints/appInfo';
import { assert } from 'tsafe';

const sx: SystemStyleObject = {
  pt: 3,
  w: 'full',
  '&[data-is-empty="true"]': {
    pt: 0,
  },
};

export const WorkflowBuilder = memo(() => {
  const { t } = useTranslation();

  useBuilderDndMonitor();

  return (
    <Flex justifyContent="center" w="full" h="full">
      <Flex flexDir="column" w="full" maxW="768px" gap={2}>
        <Flex w="full" alignItems="center" gap={2} pt={3}>
          <AddFormElementDndButton type="container">{t('workflows.builder.container')}</AddFormElementDndButton>
          <AddFormElementDndButton type="divider">{t('workflows.builder.divider')}</AddFormElementDndButton>
          <AddFormElementDndButton type="heading">{t('workflows.builder.heading')}</AddFormElementDndButton>
          <AddFormElementDndButton type="text">{t('workflows.builder.text')}</AddFormElementDndButton>
          <Button size="sm" variant="ghost" tooltip={t('workflows.builder.nodeFieldTooltip')}>
            {t('workflows.builder.nodeField')}
          </Button>
          <Spacer />
          <WorkflowBuilderEditMenu />
        </Flex>
        <ScrollableContent>
          <WorkflowBuilderContent />
        </ScrollableContent>
      </Flex>
    </Flex>
  );
});
WorkflowBuilder.displayName = 'WorkflowBuilder';

const WorkflowBuilderContent = memo(() => {
  const { t } = useTranslation();
  const isFormEmpty = useAppSelector(selectIsFormEmpty);
  const openApiSchemaQuery = useGetOpenAPISchemaQuery();
  const loadedTemplates = useStore($hasTemplates);

  if (openApiSchemaQuery.isLoading || !loadedTemplates) {
    return <IAINoContentFallback label={t('nodes.loadingNodes')} icon={null} />;
  }

  return (
    <Flex sx={sx} data-is-empty={isFormEmpty}>
      <RootContainerElementEditMode />
    </Flex>
  );
});
WorkflowBuilderContent.displayName = 'WorkflowBuilderContent';

const useAddFormElementDnd = (
  type: Exclude<FormElement['type'], 'node-field'>,
  draggableRef: RefObject<HTMLElement>
) => {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const draggableElement = draggableRef.current;
    if (!draggableElement) {
      return;
    }
    return combine(
      firefoxDndFix(draggableElement),
      draggable({
        element: draggableElement,
        getInitialData: () => {
          if (type === 'container') {
            const element = buildContainer('row', []);
            return buildFormElementDndData(element);
          }
          if (type === 'divider') {
            const element = buildDivider();
            return buildFormElementDndData(element);
          }
          if (type === 'heading') {
            const element = buildHeading('');
            return buildFormElementDndData(element);
          }
          if (type === 'text') {
            const element = buildText('');
            return buildFormElementDndData(element);
          }
          assert(false);
        },
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop: () => {
          setIsDragging(false);
        },
      })
    );
  }, [draggableRef, type]);

  return isDragging;
};

const addFormElementButtonSx: SystemStyleObject = {
  cursor: 'grab',
  borderStyle: 'dashed',
  _active: { borderStyle: 'dashed' },
  _disabled: { borderStyle: 'dashed', opacity: 0.5 },
};

const AddFormElementDndButton = ({
  type,
  children,
}: PropsWithChildren<{ type: Parameters<typeof useAddFormElementDnd>[0] }>) => {
  const draggableRef = useRef<HTMLDivElement>(null);
  const isDragging = useAddFormElementDnd(type, draggableRef);

  return (
    // Must be as div for draggable to work correctly
    <Button as="div" ref={draggableRef} size="sm" isDisabled={isDragging} variant="outline" sx={addFormElementButtonSx}>
      {children}
    </Button>
  );
};
