describe('AMD loader', function () {
    it('loads the Promise module successfully', function (done) {
        require(['../../promise'], function (Promise) {
            expect(Promise).to.be.a('function');
            expect(Promise.resolve).to.be.a('function');
            expect(Promise.all).to.be.a('function');
            done();
        });
    });
});   
