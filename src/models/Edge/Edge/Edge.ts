import Vertex from '../../Vertex/Vertex/Vertex';

abstract class Edge<V extends Vertex> {
	vertexA: V;
	vertexB: V;

	constructor(vertexA: V, vertexB: V) {
		this.vertexA = vertexA;
		this.vertexB = vertexB;
	}

	transpose(): void {
		const temp = this.vertexA;
		this.vertexA = this.vertexB;
		this.vertexB = temp;
	}

	equals(other: Edge<V>): boolean {
		return this.vertexA.equals(other.vertexA) && this.vertexB.equals(other.vertexB);
	}

	compareTo(other: this): number {
		const aCompare = this.vertexA.compareTo(other.vertexA);
		if (aCompare !== 0) return aCompare;

		return this.vertexB.compareTo(other.vertexB);
	}

	abstract isDirected(): boolean;
}

export function edgeEqual<V extends Vertex, E extends Edge<V>>(a: E, b: E) {
	return a.equals(b);
}

export function edgeCompareTo<V extends Vertex, E extends Edge<V>>(a: E, b: E): number {
	return a.compareTo(b);
}

export default Edge;
