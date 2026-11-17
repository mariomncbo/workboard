import Testing
@testable import WorkBoard

@Suite("Posiciones fraccionarias")
struct FractionalPositionTests {
    @Test("Entre dos elementos, el punto medio")
    func betweenTwo() {
        #expect(FractionalPosition.between(1, and: 2) == 1.5)
        #expect(FractionalPosition.between(-3, and: 0) == -1.5)
    }

    @Test("Al principio, una unidad antes del primero")
    func atStart() {
        #expect(FractionalPosition.between(nil, and: 1) == 0)
    }

    @Test("Al final, una unidad después del último")
    func atEnd() {
        #expect(FractionalPosition.between(4, and: nil) == 5)
        #expect(FractionalPosition.after(4) == 5)
    }

    @Test("En una colección vacía, la primera posición es 1")
    func empty() {
        #expect(FractionalPosition.between(nil, and: nil) == 1)
        #expect(FractionalPosition.after(nil) == 1)
    }

    @Test("Mover muchas veces al mismo hueco mantiene el orden")
    func repeatedMovesKeepOrder() {
        let first = 1.0
        var second = 2.0
        for _ in 0..<40 {
            let moved = FractionalPosition.between(first, and: second)
            #expect(first < moved && moved < second)
            second = moved
        }
    }
}
