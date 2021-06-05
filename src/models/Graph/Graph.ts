import Vertex, { vertexCompareTo, vertexEqual } from '../Vertex/Vertex/Vertex';
import Edge, { edgeEqual } from '../Edge/Edge/Edge';
import * as _ from 'lodash';
import AdjacencyMatrix from '../Matrix/AdjacencyMatrix';
import VertexNotFoundError from '../../Errors/VertexNotFoundError';
import AdjacencyList from '../AdjacencyList/AdjacencyList';

class Graph<V extends Vertex, E extends Edge<V>> {
	// Redundant information storage for performance
	protected _listOfEdges: E[];
	protected _listOfVertices: V[];

	protected _adjacencyMatrix: AdjacencyMatrix<V>;

	protected _adjacencyList: AdjacencyList<V>;

	protected _addUnknownVerticesInEdges: boolean;

	constructor(addUnknownVerticesInEdges: boolean = false) {
		this._listOfEdges = [];
		this._listOfVertices = [];
		this._adjacencyMatrix = new AdjacencyMatrix<V>();
		this._adjacencyList = new AdjacencyList<V>();

		this._addUnknownVerticesInEdges = addUnknownVerticesInEdges;
	}

	addVertex(...vertex: V[]): Graph<V, E> {
		const uniqueVertices = _.uniqWith(vertex, vertexEqual);
		const filteredVertices = _.differenceWith(uniqueVertices, this._listOfVertices, vertexEqual);
		filteredVertices.forEach((singleVertex) => {
			this._listOfVertices.push(singleVertex);
			this._adjacencyList.initVertex(singleVertex);
		});

		return this;
	}

	addEdge(...edge: E[]): Graph<V, E> {
		const uniqueEdges = _.uniqWith(edge, edgeEqual);
		const filteredEdges = _.differenceWith(uniqueEdges, this._listOfEdges, edgeEqual);

		if (!this.addsUnknownVerticesInEdges())
			filteredEdges.forEach((singleEdge) => this.validateEdgeVerticesAreContainedInGraph(singleEdge));
		else filteredEdges.forEach((singleEdge) => this.addVertex(singleEdge.vertexA, singleEdge.vertexB));

		filteredEdges.forEach((singleEdge) => {
			this._listOfEdges.push(singleEdge);

			this._adjacencyMatrix.set(singleEdge.vertexA, singleEdge.vertexB, true);
			this._adjacencyList.addAdjacency(singleEdge.vertexA, singleEdge.vertexB);

			if (!singleEdge.isDirected()) {
				this._adjacencyMatrix.set(singleEdge.vertexB, singleEdge.vertexA, true);
			}
		});

		return this;
	}

	getAdjacentVerticesFor(vertex: V): V[] {
		return this.getAdjacencyList().getAdjacentVertices(vertex);
	}

	getChildNodes(vertex: V): V[] {
		const allEdges = this.getListOfEdges();
		const allVertices = this.getListOfVertices();
		let result: V[] = [];

		// ToDo: Possible optimization: just return adjacency list for the node if graph is undirected (keep track with a property)

		if (allEdges.length >= allVertices.length) {
			const adjacencyMatrix = this.getAdjacencyMatrix();
			result = allVertices.filter((maybeChild) => {
				return adjacencyMatrix.get(vertex, maybeChild);
			});
		} else {
			allEdges.forEach((singleEdge) => {
				if (singleEdge.vertexA.equals(vertex)) result.push(singleEdge.vertexB);

				if (!singleEdge.isDirected() && singleEdge.vertexB.equals(vertex)) result.push(singleEdge.vertexA);
			});
		}

		return _.uniqWith(result, vertexEqual);
	}

	getEdges(vertexA: V, vertexB: V): E[] {
		return this.getListOfEdges().filter(
			(maybeWantedEdge) =>
				(maybeWantedEdge.vertexA.equals(vertexA) && maybeWantedEdge.vertexB.equals(vertexB)) ||
				(maybeWantedEdge.isDirected() &&
					maybeWantedEdge.vertexA.equals(vertexB) &&
					maybeWantedEdge.vertexB.equals(vertexA)),
		);
	}

	// dfsForEach(
	// 	cb: (info: graphIterationCallbackParameter<V, E, this>) => void,
	// 	startVertex: Vertex | undefined = undefined,
	// 	orderFunction: (a: V, b: V, more?: graphIterationCallbackParameter<V, E, this>) => number = vertexCompareTo,
	// ) {
	// 	const graphCopy = this.copy();
	// 	const takenEdge = null;
	//
	// 	let firstVertex: V | undefined;
	//
	// 	if (startVertex === undefined) {
	// 		const listOfNodes = this.getListOfVertices();
	// 		if (listOfNodes.length === 0) firstVertex = undefined;
	// 		else listOfNodes.sort(orderFunction)[0];
	// 	} else {
	// 		firstVertex = startVertex;
	// 	}
	//
	// 	//...
	// }

	// *dfsIterator(
	// 	startVertex: V | undefined,
	// 	orderFunction: (a: V, b: V, more?: graphIterationCallbackParameter<V, E, this>) => number = vertexCompareTo,
	// ): Generator<Omit<graphIterationCallbackParameter<V, E, this>, 'payload'>, void, unknown> {
	// 	const visited: Map<V, boolean> = new Map();
	// 	for (const singleVertexInGraph of this.getListOfVertices()) visited.set(singleVertexInGraph, false);
	//
	// 	let currentVertex: V | undefined;
	//
	// 	if (startVertex === undefined) {
	// 		const listOfNodes = this.getListOfVertices();
	// 		if (listOfNodes.length === 0) currentVertex = undefined;
	// 		else {
	// 			listOfNodes.sort(orderFunction);
	// 			currentVertex = listOfNodes[0];
	// 		}
	// 	} else {
	// 		currentVertex = startVertex;
	// 	}
	//
	// 	const stack: V[] = [];
	//
	// 	if (currentVertex !== undefined) {
	// 		stack.push(currentVertex);
	//
	// 		visited.set(currentVertex, true);
	// 		let takenEdge = null;
	//
	// 		while (stack.length !== 0) {
	// 			currentVertex = stack.pop()!;
	// 			if (!visited.get(currentVertex)) {
	// 				visited.set(currentVertex, true);
	// 			}
	// 		}
	// 	}
	// }

	copy(): this {
		return _.cloneDeep(this);
	}

	getListOfEdges(): E[] {
		return _.cloneDeep(this._listOfEdges);
	}

	getListOfVertices(): V[] {
		return _.cloneDeep(this._listOfVertices);
	}

	getAdjacencyMatrix(): AdjacencyMatrix<V> {
		return _.cloneDeep(this._adjacencyMatrix);
	}

	getAdjacencyList(): AdjacencyList<V> {
		return _.cloneDeep(this._adjacencyList);
	}

	addsUnknownVerticesInEdges(): boolean {
		return this._addUnknownVerticesInEdges;
	}

	validateEdgeVerticesAreContainedInGraph(edge: E) {
		this.validateVertexIsContainedInGraph(edge.vertexA);
		this.validateVertexIsContainedInGraph(edge.vertexB);
	}

	validateVertexIsContainedInGraph(vertex: V) {
		if (!this.isVertexContainedInGraph(vertex)) throw new VertexNotFoundError(vertex);
	}

	isVertexContainedInGraph(vertex: V): boolean {
		return this._listOfVertices.find((singleVertex) => singleVertex.equals(vertex)) !== undefined;
	}
}

export interface graphIterationCallbackParameter<V extends Vertex, E extends Edge<V>, G extends Graph<V, E>> {
	graph: Readonly<G>;
	currentVertex: Readonly<V>;
	visited: Readonly<Map<V, boolean>>;
	takenEdge: Readonly<E | null>;
	payload: any;
}

export default Graph;
