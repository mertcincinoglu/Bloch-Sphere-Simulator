from qutip import *
import numpy as np

b = Bloch3d()
yellow = "#969632"
blue = "#323296"
#b3d.sphere_color = "#808080"
b.sphere_alpha = 0.5

b.clear()

vectors = [[np.sqrt(1), 0, 0], [0, np.sqrt(1), 0], [0, 0, np.sqrt(1)]]
b.add_vectors(vectors, 0.2)

th = np.linspace(0, 2*np.pi, 20)
xp = np.cos(th)
yp = np.sin(th)
zp = np.zeros(20)

pnts = [xp, yp, zp]
b.add_points(pnts)

b.show()
